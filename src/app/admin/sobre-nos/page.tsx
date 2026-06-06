import { saveAboutSettings } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/store-settings";

export default async function AdminSobreNosPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <AdminShell
      title="Sobre Nós"
      description="Gerir o conteúdo institucional e os contactos visíveis na página Sobre Nós."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
        <form action={saveAboutSettings} className="grid gap-4 md:grid-cols-2">
          <input
            name="contactTitle"
            defaultValue={settings.contactTitle}
            placeholder="Título da página Sobre Nós"
            className="h-12 rounded-2xl border px-4 md:col-span-2"
            required
          />

          <textarea
            name="contactIntro"
            defaultValue={settings.contactIntro}
            placeholder="Introdução principal da página Sobre Nós"
            className="min-h-28 rounded-2xl border px-4 py-3 md:col-span-2"
            required
          />

          <input
            name="location"
            defaultValue={settings.location}
            placeholder="Localização"
            className="h-12 rounded-2xl border px-4"
            required
          />

          <input
            name="phone"
            defaultValue={settings.phone}
            placeholder="Telefone"
            className="h-12 rounded-2xl border px-4"
            required
          />

          <input
            name="whatsappNumber"
            defaultValue={settings.whatsappNumber}
            placeholder="WhatsApp sem espaços"
            className="h-12 rounded-2xl border px-4"
            required
          />

          <input
            name="whatsappLabel"
            defaultValue={settings.whatsappLabel}
            placeholder="Texto curto do WhatsApp"
            className="h-12 rounded-2xl border px-4"
            required
          />

          <input
            name="contactEmail"
            defaultValue={settings.contactEmail ?? ""}
            placeholder="Email"
            className="h-12 rounded-2xl border px-4"
          />

          <input
            name="openingHours"
            defaultValue={settings.openingHours}
            placeholder="Horário"
            className="h-12 rounded-2xl border px-4"
            required
          />

          <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
            Guardar dados do Sobre Nós
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
