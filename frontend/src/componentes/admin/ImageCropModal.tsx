import { useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { getCroppedImage } from '../../shared/cropImage';

type ImageCropModalProps = {
  file: File | null;
  open: boolean;
  title: string;
  aspect?: number;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
};

export default function ImageCropModal({
  file,
  open,
  title,
  aspect = 1,
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  const selectedFile = file;

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setSaving(false);
      setError('');
    }
  }, [open, file]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!open || !selectedFile || !imageUrl) {
    return null;
  }

  async function handleConfirm() {
    const currentFile = file;

    if (!croppedAreaPixels) {
      setError('Ajusta el recorte antes de continuar.');
      return;
    }

    if (!currentFile) {
      setError('No se encontró la imagen a recortar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const croppedFile = await getCroppedImage(currentFile, croppedAreaPixels);
      await onConfirm(croppedFile);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo aplicar el recorte');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-modalOverlay" onClick={onClose}>
      <div className="adm-modal adm-cropModal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modalHeader">
          <h2 className="adm-modalTitle">{title}</h2>
          <button className="adm-modalClose" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="adm-modalBody">
          <p className="adm-cropHint">Ajusta el encuadre para que funcione bien en Home y en las fichas de producto.</p>
          <div className="adm-cropStage">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
            />
          </div>

          <div className="adm-cropControls">
            <label className="adm-cropZoomLabel">
              Zoom
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>

          {error && <p className="adm-error" style={{ marginTop: 10 }}>{error}</p>}
        </div>

        <div className="adm-modalFooter">
          <button className="adm-btnCancel" onClick={onClose}>Cancelar</button>
          <button className="adm-btnPrimary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Aplicando...' : 'Usar recorte'}
          </button>
        </div>
      </div>
    </div>
  );
}