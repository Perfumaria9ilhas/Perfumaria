"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SiteVisitTracker } from "@/components/layout/site-visit-tracker";
import {
  clearAnalyticsStorage,
  clearMarketingStorage,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

type ConsentContextValue = {
  consent: CookieConsent | null;
  openPreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);
const GA_ID = "G-VQ486TJ198";

function GoogleAnalytics({ marketingAllowed }: { marketingAllowed: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstPageView = useRef(true);

  useEffect(() => {
    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: marketingAllowed ? "granted" : "denied",
      ad_user_data: marketingAllowed ? "granted" : "denied",
      ad_personalization: marketingAllowed ? "granted" : "denied",
    });
  }, [marketingAllowed]);

  useEffect(() => {
    if (firstPageView.current) {
      firstPageView.current = false;
      return;
    }

    window.gtag?.("event", "page_view", {
      page_path: `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`,
    });
  }, [pathname, searchParams]);

  return (
    <>
      <Script id="google-consent-and-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: '${marketingAllowed ? "granted" : "denied"}',
            ad_user_data: '${marketingAllowed ? "granted" : "denied"}',
            ad_personalization: '${marketingAllowed ? "granted" : "denied"}'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}

function MetaPixelScripts({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstPageView = useRef(true);

  useEffect(() => {
    if (firstPageView.current) {
      firstPageView.current = false;
      return;
    }

    window.fbq?.("track", "PageView");
  }, [pathname, searchParams]);

  return (
    <>
      <Script id="meta-pixel-base-consented" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('consent', 'grant');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  );
}

export function CookieConsentProvider({
  children,
  metaPixelId,
}: {
  children: ReactNode;
  metaPixelId?: string;
}) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsDraft, setAnalyticsDraft] = useState(false);
  const [marketingDraft, setMarketingDraft] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const storedConsent = readCookieConsent();
      setConsent(storedConsent);
      setAnalyticsDraft(storedConsent?.analytics ?? false);
      setMarketingDraft(storedConsent?.marketing ?? false);
      setHasLoadedPreference(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  function savePreference(analytics: boolean, marketing: boolean) {
    const revokedAnalytics = consent?.analytics === true && !analytics;
    const revokedMarketing = consent?.marketing === true && !marketing;
    const nextConsent = writeCookieConsent({ analytics, marketing });

    if (!analytics) {
      clearAnalyticsStorage();
    }

    if (!marketing) {
      clearMarketingStorage();
    }

    if (revokedAnalytics) {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
      });
    }

    if (revokedMarketing) {
      window.gtag?.("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.fbq?.("consent", "revoke");
    }

    setConsent(nextConsent);
    setAnalyticsDraft(analytics);
    setMarketingDraft(marketing);
    setPreferencesOpen(false);

    if (revokedAnalytics || revokedMarketing) {
      window.location.reload();
    }
  }

  function openPreferences() {
    setAnalyticsDraft(consent?.analytics ?? false);
    setMarketingDraft(consent?.marketing ?? false);
    setPreferencesOpen(true);
  }

  const analyticsAllowed = consent?.analytics === true;
  const marketingAllowed = consent?.marketing === true;

  return (
    <ConsentContext.Provider value={{ consent, openPreferences }}>
      {children}
      {analyticsAllowed ? <GoogleAnalytics marketingAllowed={marketingAllowed} /> : null}
      {analyticsAllowed ? <SiteVisitTracker enabled /> : null}
      {marketingAllowed && metaPixelId ? <MetaPixelScripts pixelId={metaPixelId} /> : null}

      {hasLoadedPreference && !consent ? (
        <div className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-3 sm:px-5 sm:pb-5">
          <section
            className="mx-auto max-w-4xl rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_18px_60px_rgba(55,39,28,0.22)] sm:p-5"
            aria-labelledby="cookie-banner-title"
          >
            <div className="grid min-w-0 gap-4">
              <div className="min-w-0">
                <h2 id="cookie-banner-title" className="text-xl text-[color:var(--ink)]">
                  Privacidade e cookies
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Usamos tecnologias necessárias para o carrinho e as sessões. Com a sua escolha,
                  também podemos usar análise e publicidade. Pode alterar a decisão quando quiser.
                </p>
              </div>
              <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => savePreference(true, true)}
                  className="min-h-11 rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                >
                  Aceitar todos
                </button>
                <button
                  type="button"
                  onClick={() => savePreference(false, false)}
                  className="min-h-11 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                >
                  Rejeitar não essenciais
                </button>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="min-h-11 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"
                >
                  Escolher preferências
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {preferencesOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-3 sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
        >
          <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--gold)]">
                  Privacidade
                </p>
                <h2 id="cookie-preferences-title" className="mt-2 text-2xl text-[color:var(--ink)]">
                  Definições de cookies
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreferencesOpen(false)}
                className="shrink-0 rounded-full border border-[color:var(--line)] px-4 py-2 text-sm"
                aria-label="Fechar definições de cookies"
              >
                Fechar
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
                <span>
                  <strong className="block text-[color:var(--ink)]">Necessários</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    Carrinho, sessões e preferência de cookies. Estão sempre ativos.
                  </span>
                </span>
                <input type="checkbox" checked disabled className="mt-1 h-5 w-5 shrink-0" />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--line)] p-4">
                <span>
                  <strong className="block text-[color:var(--ink)]">Análise e estatísticas</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    Google Analytics 4 e contador interno de visitas.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={analyticsDraft}
                  onChange={(event) => setAnalyticsDraft(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0"
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--line)] p-4">
                <span>
                  <strong className="block text-[color:var(--ink)]">Publicidade</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    Meta Pixel, eventos de campanhas e respetiva atribuição.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={marketingDraft}
                  onChange={(event) => setMarketingDraft(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => savePreference(false, false)}
                className="min-h-11 rounded-full border border-[color:var(--line)] bg-white px-5 py-2 text-sm font-semibold text-[color:var(--ink)]"
              >
                Rejeitar não essenciais
              </button>
              <button
                type="button"
                onClick={() => savePreference(analyticsDraft, marketingDraft)}
                className="min-h-11 rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-2 text-sm font-semibold text-[color:var(--ink)]"
              >
                Guardar preferências
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}
