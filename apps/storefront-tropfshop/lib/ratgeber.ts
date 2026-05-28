/**
 * Ratgeber-Content (Tropfshop) — Pre-Launch.
 *
 * Bewusst als typisiertes TS-Array statt MDX/CMS: kein zusaetzliches Tooling,
 * voll statisch (kein Backend-Fetch), und ueber `generateStaticParams` zur
 * Build-Zeit vorgerendert. Die Artikel sind die EINZIGEN Seiten, die in
 * Phase 1 schon indexierbar sein sollen (siehe app/robots.ts + app/sitemap.ts)
 * — sie bauen ueber die ~10 Monate bis Launch Suchmaschinen-Autoritaet und
 * Newsletter-Leads auf.
 *
 * Tonalitaet (CLAUDE.md): technisch fundiert, kein Marketing-Geschwurbel,
 * deutsch, Sie-Anrede. `relatedCategoryHandles` verweist auf Kategorie-Handles
 * aus dem Backend-Seed (apps/backend/src/scripts/seed-mock-products.ts) und
 * speist die internen Verlinkungen zum Sortiment.
 */

export type RatgeberSection = {
  heading: string;
  /** Absaetze — jeder Eintrag wird als eigener <p> gerendert. */
  paragraphs: string[];
};

export type RatgeberFaq = {
  question: string;
  answer: string;
};

export type RatgeberArticle = {
  /** URL-Segment unter /ratgeber/[slug]. Stabil — nicht nachtraeglich aendern. */
  slug: string;
  title: string;
  /** Meta-Description + Teaser in der Uebersicht (< 160 Zeichen empfohlen). */
  description: string;
  /** Einleitender Absatz, oberhalb der Sektionen. */
  intro: string;
  /** Lesezeit in Minuten (manuell gepflegt, fuer die UI). */
  readingMinutes: number;
  /** ISO-Datum (YYYY-MM-DD) der letzten inhaltlichen Aktualisierung. */
  updatedAt: string;
  sections: RatgeberSection[];
  faq: RatgeberFaq[];
  /** Kategorie-Handles aus dem Backend-Seed fuer interne Verlinkung. */
  relatedCategoryHandles: string[];
};

const ARTICLES: readonly RatgeberArticle[] = [
  {
    slug: "tropfbewaesserung-hochbeet-planen",
    title: "Tropfbewässerung fürs Hochbeet richtig planen",
    description:
      "Wie Sie ein Hochbeet gleichmäßig und sparsam bewässern: Wasserbedarf, Schlauchführung, Tropferabstand und die passenden Komponenten.",
    intro:
      "Ein Hochbeet trocknet schneller aus als ein Beet im gewachsenen Boden — das größere Volumen über Grund und die offenen Seitenwände entziehen der Erde laufend Feuchtigkeit. Eine fest installierte Tropfbewässerung gleicht das aus, spart gegenüber dem Gießen mit der Kanne spürbar Wasser und versorgt jede Pflanze gleichmäßig. Diese Anleitung zeigt Ihnen, wie Sie die Bewässerung für ein typisches Hochbeet planen.",
    readingMinutes: 6,
    updatedAt: "2026-05-28",
    sections: [
      {
        heading: "Wasserbedarf realistisch einschätzen",
        paragraphs: [
          "Rechnen Sie für ein Hochbeet im Sommer mit rund 4 bis 6 Litern pro Quadratmeter und Tag. Ein Beet von 2 m² benötigt an heißen Tagen also etwa 8 bis 12 Liter. Diese Menge verteilen Sie besser auf zwei kurze Gänge am frühen Morgen und am Abend als auf einen langen Guss — so versickert weniger ungenutzt in die Tiefe.",
          "Druckkompensierende Tropfer geben unabhängig vom Leitungsdruck eine konstante Menge ab (typisch 2 L/h). Bei einem Tropferabstand von 30 cm und zwei parallelen Schlauchsträngen über das Beet ergibt sich daraus eine gut planbare Wassermenge pro Bewässerungsgang.",
        ],
      },
      {
        heading: "Schläuche führen und Tropfer setzen",
        paragraphs: [
          "Verlegen Sie den Tropfschlauch in Längsrichtung des Beetes, mit einem Strangabstand von 25 bis 30 cm. Bei Beeten breiter als 60 cm lohnen sich zwei bis drei parallele Stränge, damit keine trockenen Zonen zwischen den Reihen entstehen.",
          "Für punktuell wasserhungrige Pflanzen wie Tomaten oder Zucchini ergänzen Sie zusätzliche Einzeltropfer direkt an der Pflanzbasis. Fixieren Sie die Schläuche mit Erdhaken, damit sie beim Lockern der Erde nicht verrutschen.",
        ],
      },
      {
        heading: "Druck und Filterung nicht vergessen",
        paragraphs: [
          "Haushaltsleitungen liefern oft 3 bis 4 bar — deutlich mehr, als Tropfsysteme vertragen. Ein Druckminderer auf 1,5 bis 2 bar schützt die Komponenten und sorgt für ein gleichmäßiges Tropfbild. Ein Scheibenfilter hält Sedimente zurück, die sonst die feinen Tropferöffnungen verstopfen.",
          "Wer die Bewässerung automatisieren möchte, ergänzt einen einfachen Bewässerungscomputer. Schon ein mechanischer Timer für einen Kreis nimmt Ihnen das tägliche Daran-Denken ab.",
        ],
      },
    ],
    faq: [
      {
        question: "Wie lange sollte die Tropfbewässerung pro Gang laufen?",
        answer:
          "Das hängt von der Tropferleistung ab. Mit 2-L/h-Tropfern im 30-cm-Abstand sind 20 bis 30 Minuten am Morgen und Abend für ein durchschnittliches Hochbeet ein guter Startwert. Prüfen Sie nach einigen Tagen die Bodenfeuchte in 10 cm Tiefe und passen Sie die Dauer an.",
      },
      {
        question: "Brauche ich für ein kleines Hochbeet wirklich einen Druckminderer?",
        answer:
          "Ja. Auch kleine Systeme leiden unter zu hohem Leitungsdruck — Tropfer geben dann zu viel ab, Verbindungen können sich lösen. Ein Druckminderer ist eine günstige Versicherung gegen ungleichmäßige Bewässerung und Materialschäden.",
      },
    ],
    relatedCategoryHandles: ["komplett-sets", "tropfschlaeuche", "tropfer"],
  },
  {
    slug: "tomaten-richtig-bewaessern",
    title: "Tomaten richtig bewässern: Menge, Rhythmus, Technik",
    description:
      "Gleichmäßige Wasserversorgung beugt Blütenendfäule und geplatzten Früchten vor. So bewässern Sie Tomaten mit Tropftechnik zuverlässig.",
    intro:
      "Tomaten reagieren empfindlich auf schwankende Wasserversorgung: Wechselt trockener mit nassem Boden, platzen reife Früchte auf, und Kalziummangel durch ungleichmäßige Feuchte begünstigt die Blütenendfäule. Tropfbewässerung liefert kleine, regelmäßige Wassermengen genau an die Wurzel — ideal für eine stabile Versorgung.",
    readingMinutes: 5,
    updatedAt: "2026-05-28",
    sections: [
      {
        heading: "Wie viel Wasser Tomaten brauchen",
        paragraphs: [
          "Eine ausgewachsene Tomatenpflanze verbraucht im Hochsommer 1 bis 2 Liter pro Tag, im Gewächshaus eher mehr. Wichtiger als die absolute Menge ist die Gleichmäßigkeit: lieber täglich eine kleinere Gabe als alle drei Tage eine große.",
          "Mit einem druckkompensierenden Einzeltropfer (2 L/h) pro Pflanze erreichen Sie in etwa 30 bis 60 Minuten Laufzeit die Tagesmenge. Gießen Sie am Morgen, damit die Pflanze tagsüber versorgt ist und das Laub abends trocken bleibt — das senkt den Pilzdruck.",
        ],
      },
      {
        heading: "Wasser an die Wurzel, nicht aufs Blatt",
        paragraphs: [
          "Tropfbewässerung benetzt das Laub nicht — ein entscheidender Vorteil gegenüber dem Gießen von oben, denn Kraut- und Braunfäule breiten sich vor allem über nasse Blätter aus. Setzen Sie den Tropfer einige Zentimeter neben den Stamm, damit der Wurzelballen gleichmäßig durchfeuchtet wird.",
          "Eine Mulchschicht über dem feuchten Boden reduziert die Verdunstung zusätzlich und hält die Feuchte konstanter — gerade an heißen, windigen Tagen.",
        ],
      },
      {
        heading: "Druck regeln, Versorgung automatisieren",
        paragraphs: [
          "Auch hier gilt: Ein Druckminderer auf 1,5 bar sorgt dafür, dass alle Tropfer entlang der Reihe gleich viel abgeben — sonst bekommen die ersten Pflanzen zu viel und die letzten zu wenig. In Verbindung mit einem Bewässerungstimer läuft die Versorgung auch im Urlaub zuverlässig weiter.",
        ],
      },
    ],
    faq: [
      {
        question: "Sollte ich Tomaten täglich oder seltener bewässern?",
        answer:
          "Täglich in kleinen Mengen ist besser als selten und viel. Konstante Bodenfeuchte beugt geplatzten Früchten und Blütenendfäule vor. Eine Zeitschaltuhr mit Tropfbewässerung macht die tägliche Gabe mühelos.",
      },
      {
        question: "Kann ich mehrere Tomaten an einen Strang hängen?",
        answer:
          "Ja. Ein Verteilerschlauch mit je einem druckkompensierenden Tropfer pro Pflanze versorgt eine ganze Reihe gleichmäßig — vorausgesetzt, der Druck ist über einen Druckminderer geregelt.",
      },
    ],
    relatedCategoryHandles: ["komplett-sets", "tropfer", "druckminderer"],
  },
  {
    slug: "druckminderer-richtig-waehlen",
    title: "Druckminderer wählen: Welcher Druck für welches System?",
    description:
      "Warum Tropfsysteme einen Druckminderer brauchen und wie Sie zwischen 0,7, 1,0, 1,5 und 2,0 bar die richtige Stufe für Ihr Setup wählen.",
    intro:
      "Der Druckminderer ist die unscheinbarste, aber oft wichtigste Komponente einer Tropfbewässerung. Er senkt den hohen Leitungsdruck auf einen Wert, mit dem Tropfer und Verbinder sauber arbeiten. Dieser Ratgeber erklärt, welche Druckstufe zu welchem System passt.",
    readingMinutes: 5,
    updatedAt: "2026-05-28",
    sections: [
      {
        heading: "Warum überhaupt der Druck gesenkt werden muss",
        paragraphs: [
          "Trinkwasserleitungen liefern typischerweise 3 bis 6 bar. Tropfschläuche und Mikro-Tropfer sind aber für 1 bis 2 bar ausgelegt. Zu hoher Druck führt zu Übermengen an den Tropfern, gelösten Klemmverbindern und im Extremfall zu geplatzten Schläuchen.",
          "Druckkompensierende Tropfer halten ihre Abgabemenge zwar über einen weiten Bereich konstant — aber nur innerhalb ihres zulässigen Druckfensters. Ein vorgeschalteter Druckminderer stellt sicher, dass Sie in genau diesem Fenster bleiben.",
        ],
      },
      {
        heading: "Die Druckstufen und ihre Einsatzgebiete",
        paragraphs: [
          "0,7 bar: für besonders empfindliche Mikro-Tropfsysteme und kurze Stränge, etwa Balkonkästen oder einzelne Topfgruppen.",
          "1,0 bar: solider Allrounder für Standard-Tropfschläuche und kleinere Mikro-Tropfer-Setups.",
          "1,5 bar: die häufigste Wahl für Hochbeete und Reihenkulturen mit druckkompensierenden Tropfern — ein guter Kompromiss aus Durchfluss und Sicherheit.",
          "2,0 bar: für längere Stränge und höhere Durchflussmengen, bei denen entlang der Leitung etwas Druck verloren geht.",
        ],
      },
      {
        heading: "Einbau und Reihenfolge",
        paragraphs: [
          "Der Druckminderer gehört direkt hinter den Wasseranschluss bzw. das Absperrventil und vor den Filter und die Verteilung. Achten Sie auf die Durchflussrichtung (Pfeil auf dem Gehäuse). Kombinieren Sie ihn mit einem Scheibenfilter, um die Tropfer dauerhaft vor Verstopfung zu schützen.",
        ],
      },
    ],
    faq: [
      {
        question: "Was passiert, wenn ich keinen Druckminderer einsetze?",
        answer:
          "Bei zu hohem Druck geben Tropfer zu viel Wasser ab, die Verteilung wird ungleichmäßig, und Steckverbindungen können sich lösen oder Schläuche platzen. Ein Druckminderer ist deshalb in fast allen Setups mit Haushaltsanschluss Pflicht.",
      },
      {
        question: "Welche Druckstufe ist für ein normales Hochbeet richtig?",
        answer:
          "Für ein Hochbeet mit druckkompensierenden Tropfern sind 1,5 bar die übliche Empfehlung. Bei sehr kurzen Strängen oder empfindlichen Mikro-Tropfern kann auch 1,0 bar genügen.",
      },
    ],
    relatedCategoryHandles: ["druckminderer"],
  },
];

/**
 * Anzeigenamen der Produkt-Kategorien (Handle → Label), gespiegelt aus dem
 * Backend-Seed (apps/backend/src/scripts/seed-mock-products.ts). Bewusst
 * statisch, damit die indexierbaren Ratgeber-Seiten OHNE Backend-Fetch
 * vorgerendert werden koennen. Bei neuen Kategorien hier ergaenzen.
 */
const CATEGORY_LABELS: Record<string, string> = {
  tropfschlaeuche: "Tropfschläuche",
  druckminderer: "Druckminderer",
  "verbinder-verteilung": "Verbinder & Verteilung",
  tropfer: "Tropfer",
  filter: "Filter",
  "ventile-steuerung": "Ventile & Steuerung",
  "komplett-sets": "Komplett-Sets",
};

/** Lesbares Label fuer einen Kategorie-Handle (Fallback: der Handle selbst). */
export function categoryLabel(handle: string): string {
  return CATEGORY_LABELS[handle] ?? handle;
}

/** Alle Artikel in Anzeige-Reihenfolge. */
export function getAllRatgeberArticles(): readonly RatgeberArticle[] {
  return ARTICLES;
}

/** Einzelnen Artikel per Slug holen — `undefined`, wenn unbekannt. */
export function getRatgeberArticle(slug: string): RatgeberArticle | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Alle Slugs (fuer generateStaticParams + sitemap). */
export const ratgeberSlugs: readonly string[] = ARTICLES.map((a) => a.slug);
