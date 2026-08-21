import { useEffect, useRef, useState } from 'react';
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

// ─── Inner component ──────────────────────────────────────────────────────────
// Recibe una `imageUrl` ya resuelta y una `file` garantizados como no-nulos.
// Al montar siempre parte desde cero gracias a la `key` externa.
function CropModalInner({
  imageUrl,
  file,
  title,
  aspect,
  onClose,
  onConfirm,
}: {
  imageUrl: string;
  file: File;
  title: string;
  aspect: number;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // FIX 2: "rerender-state-only-in-handlers"
  // croppedAreaPixels no influye en el render; solo se lee en handleConfirm.
  // Usar useRef evita re-renders innecesarios en cada movimiento del crop.
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  async function handleConfirm() {
    const croppedAreaPixels = croppedAreaPixelsRef.current;

    if (!croppedAreaPixels) {
      setError('Ajusta el recorte antes de continuar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const croppedFile = await getCroppedImage(file, croppedAreaPixels);
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
              onCropComplete={(_: Area, croppedPixels: Area) => {
                // FIX 2: actualizar ref, no state — sin re-render por cada pixel
                croppedAreaPixelsRef.current = croppedPixels;
              }}
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

// ─── Wrapper público ──────────────────────────────────────────────────────────
// FIX 1: "no-create-object-url-in-render" + "no-create-object-url-without-revoke"
// La URL se crea y destruye EXCLUSIVAMENTE dentro de un useEffect, garantizando
// que revokeObjectURL se llame siempre en el cleanup, sin fugas de memoria.
//
// FIX 3: "no-reset-all-state-on-prop-change"
// En lugar de un useEffect que resetea estado interno al cambiar `file` o `open`,
// se usa `key={keyValue}` en CropModalInner para que React desmonte/monte el
// subcomponente limpio automáticamente — patrón idiomático recomendado por React.
export default function ImageCropModal({
  file,
  open,
  title,
  aspect = 1,
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // FIX 1: crear y revocar la object URL en un único efecto controlado.
  useEffect(() => {
    if (!open || !file) {
      setImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setImageUrl(null);
    };
  }, [file, open]);

  if (!open || !file || !imageUrl) {
    return null;
  }

  // FIX 3: la key combina el nombre del archivo + tamaño para que, si el
  // usuario elige un archivo diferente (aunque tenga el mismo nombre), el
  // inner component se desmonte y monte limpio, sin useEffect de reset.
  const keyValue = `${file.name}-${file.size}-${file.lastModified}`;

  return (
    <CropModalInner
      key={keyValue}
      imageUrl={imageUrl}
      file={file}
      title={title}
      aspect={aspect}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}