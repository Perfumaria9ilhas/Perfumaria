import { deleteStoreReview } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminReviewsData } from "@/lib/data";

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, rating));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}

export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await getAdminReviewsData();

  return (
    <AdminShell
      title="Comentários"
      description="Veja os comentários deixados na loja e apague qualquer comentário duplicado ou indesejado."
    >
      <section className="space-y-4">
        {reviews.length ? (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--atlantic)]">
                      {renderStars(review.rating)}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">{review.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Intl.DateTimeFormat("pt-PT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(review.createdAt)}
                    </p>
                  </div>
                  <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-700">
                    {review.comment}
                  </p>
                </div>

                <form action={deleteStoreReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Apagar comentário
                  </button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <article className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 text-sm text-slate-600 shadow-sm">
            Ainda não existem comentários guardados na loja.
          </article>
        )}
      </section>
    </AdminShell>
  );
}
