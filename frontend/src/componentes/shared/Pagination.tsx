import './Pagination.css';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [] as number[];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p += 1) pages.push(p);

  return (
    <nav className="ph-pagination" aria-label="Paginación">
      <button
        type="button"
        className="ph-paginationBtn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>

      <div className="ph-paginationPages">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={p === page ? 'ph-paginationPage isActive' : 'ph-paginationPage'}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="ph-paginationBtn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
