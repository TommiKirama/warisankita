/**
 * Fiqh knowledge base for Islamic estate planning.
 *
 * Powers the Faraid Education Hub and grounds the (scripted) Wasiyyah assistant.
 * References are to widely-published primary sources; for any binding ruling
 * users are directed to JAKIM e-Fatwa and a certified scholar.
 */

export interface Citation {
  source: string;
  reference: string;
  text: string;
}

export interface Lesson {
  id: string;
  category: "wasiyyah" | "faraid" | "hibah" | "waqf" | "process";
  title: string;
  titleMs: string;
  durationMin: number;
  summary: string;
  body: string[];
  citations: Citation[];
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
}

export const LESSONS: Lesson[] = [
  {
    id: "order-of-settlement",
    category: "process",
    title: "The Four Steps of Estate Settlement",
    titleMs: "Empat Langkah Penyelesaian Harta Pusaka",
    durationMin: 3,
    summary: "Before Faraid distribution, an estate is settled in a fixed Shariah order: funeral, debts, then bequests (max 1/3), then inheritance.",
    body: [
      "An estate (tirkah) is never distributed by Faraid immediately. Four obligations are settled in order:",
      "1. Funeral and burial expenses (takfin) of the deceased.",
      "2. Settlement of all debts — debts to Allah (e.g. unpaid zakat, missed Hajj) and debts to people.",
      "3. Execution of valid bequests (wasiyyah) up to a maximum of one-third of what remains.",
      "4. Distribution of the remainder to the fixed heirs by Faraid.",
      "Only after steps 1–3 does the Faraid engine divide the net estate.",
    ],
    citations: [
      { source: "Qurʾan", reference: "An-Nisaʾ 4:11", text: "…after any bequest he may have made or any debt…" },
    ],
  },
  {
    id: "one-third-limit",
    category: "wasiyyah",
    title: "The One-Third Bequest Limit",
    titleMs: "Had Wasiat Satu Pertiga",
    durationMin: 3,
    summary: "A Muslim may bequeath at most one-third of the net estate to non-heirs or charity. More than that requires the heirs' consent.",
    body: [
      "When Saʿd ibn Abi Waqqas (raḍiyallāhu ʿanhu) was seriously ill, he asked the Prophet ﷺ if he could give away two-thirds, then half, of his wealth.",
      "The Prophet ﷺ replied: 'One-third, and one-third is much (or plenty). To leave your heirs wealthy is better than to leave them poor, begging from people.'",
      "Therefore wasiyyah to non-heirs and charity is capped at one-third of the estate remaining after debts. A bequest beyond one-third is only valid if the adult heirs consent after death.",
    ],
    citations: [
      { source: "Hadith", reference: "Sahih al-Bukhari 2742", text: "One-third, and one-third is much…" },
      { source: "Hadith", reference: "Sahih Muslim 1628", text: "Narrated by Saʿd ibn Abi Waqqas." },
    ],
  },
  {
    id: "no-bequest-to-heir",
    category: "wasiyyah",
    title: "No Bequest for a Faraid Heir",
    titleMs: "Tiada Wasiat untuk Waris",
    durationMin: 2,
    summary: "A bequest cannot be made to someone who already inherits by Faraid, because Allah has already fixed their share.",
    body: [
      "The Prophet ﷺ said: 'Allah has given each one entitled his due; so there is no bequest for an heir.'",
      "This prevents a person from using wasiyyah to favour one Faraid heir over another, which would undermine the divinely fixed shares.",
      "A bequest may still be made to relatives who are NOT Faraid heirs (e.g. an adopted child, a non-Muslim relative, a grandchild whose parent is alive) — within the one-third limit.",
    ],
    citations: [
      { source: "Hadith", reference: "Sunan Abu Dawud 2870", text: "There is no bequest for an heir." },
      { source: "Hadith", reference: "Jamiʿ at-Tirmidhi 2120", text: "Allah has given each entitled one his right…" },
    ],
  },
  {
    id: "faraid-shares",
    category: "faraid",
    title: "How Faraid Shares Work",
    titleMs: "Bagaimana Bahagian Faraid Berfungsi",
    durationMin: 4,
    summary: "Heirs are either fixed-share holders (ashab al-furud) or residuaries (ʿasabah). Quranic fractions are 1/2, 1/4, 1/8, 2/3, 1/3, 1/6.",
    body: [
      "Ashab al-furud receive a fixed fraction stated in the Qurʾan: husband 1/2 or 1/4; wife 1/4 or 1/8; mother 1/6 or 1/3; daughters 1/2 or 2/3; and so on.",
      "ʿAsabah (residuaries, e.g. sons, father, brothers) take whatever remains after the fixed shares. The rule for mixed genders is 'to the male a share equal to two females.'",
      "Two corrections keep the maths exact: ʿAul reduces every share proportionally when the fixed shares exceed the estate; Radd returns any surplus to the fixed-share heirs when there is no residuary.",
    ],
    citations: [
      { source: "Qurʾan", reference: "An-Nisaʾ 4:11", text: "Allah instructs you concerning your children: for the male, what is equal to the share of two females…" },
      { source: "Qurʾan", reference: "An-Nisaʾ 4:12", text: "…for the wives a quarter… or an eighth if you leave a child…" },
      { source: "Qurʾan", reference: "An-Nisaʾ 4:176", text: "…they ask you for a ruling on kalalah…" },
    ],
  },
  {
    id: "hibah",
    category: "hibah",
    title: "Hibah — Gifting in Your Lifetime",
    titleMs: "Hibah — Pemberian Semasa Hidup",
    durationMin: 3,
    summary: "Hibah is an immediate, completed gift made during life. Once validly transferred and possessed, it is outside the estate and not subject to Faraid.",
    body: [
      "Hibah is a voluntary transfer of ownership without compensation, taking effect during the giver's lifetime.",
      "For hibah to be complete it generally requires offer and acceptance and, in most views, the recipient taking possession (qabd).",
      "Properly executed hibah is a valid tool to provide for a spouse, a daughter, or a dependant beyond their Faraid share — but it must be real, not a device to defraud heirs of their rights.",
    ],
    citations: [
      { source: "Hadith", reference: "Sahih al-Bukhari 2586", text: "Be equal and just among your children (in gifts)." },
    ],
  },
  {
    id: "waqf",
    category: "waqf",
    title: "Waqf — Endowment as Ongoing Charity",
    titleMs: "Wakaf — Sedekah Berterusan",
    durationMin: 3,
    summary: "Waqf dedicates an asset so its benefit flows perpetually to a charitable cause — a form of sadaqah jariyah that continues after death.",
    body: [
      "In waqf the asset itself is held in perpetuity and its usufruct (rent, yield, use) is dedicated to a cause — a masjid, school, well, or the poor.",
      "The Prophet ﷺ said charity continues to benefit a person after death through 'ongoing charity (sadaqah jariyah).'",
      "A waqf created during life or by bequest (within the one-third) lets wealth keep earning reward for the deceased.",
    ],
    citations: [
      { source: "Hadith", reference: "Sahih Muslim 1631", text: "When a person dies, their deeds end except three: ongoing charity, beneficial knowledge, and a righteous child who prays for them." },
    ],
  },
];

export const FAQ: FaqEntry[] = [
  {
    id: "faq-adopted-child",
    question: "Does my adopted child inherit through Faraid?",
    answer: "An adopted child is not a Faraid heir (adoption does not create lineage in Islam). You can provide for them through a bequest (wasiyyah) up to one-third of your estate, or through hibah during your lifetime.",
    citations: [{ source: "Qurʾan", reference: "Al-Ahzab 33:4-5", text: "…nor has He made your adopted sons your [true] sons… call them by [the names of] their fathers." }],
  },
  {
    id: "faq-epf",
    question: "Is my EPF nomination the same as Faraid?",
    answer: "No. In Malaysia an EPF nominee is treated as an administrator (wasi) who must distribute the money according to Faraid, not as an absolute owner — unless rules state otherwise. Naming a nominee speeds access but does not override Shariah distribution.",
    citations: [{ source: "JAKIM e-Fatwa", reference: "Muzakarah Jawatankuasa Fatwa", text: "EPF savings form part of the estate and are distributed by faraidh." }],
  },
  {
    id: "faq-joint-property",
    question: "How is jointly-owned property handled?",
    answer: "Only the deceased's own share of a jointly-owned asset enters the estate. The surviving co-owner keeps their portion; the deceased's portion is then distributed by Faraid after debts and bequests.",
    citations: [{ source: "Qurʾan", reference: "An-Nisaʾ 4:7", text: "For men is a share of what the parents and close relatives leave, and for women is a share…" }],
  },
];

/** Quick citation lookup for the assistant. */
export const KEY_CITATIONS: Record<string, Citation> = {
  oneThird: { source: "Hadith", reference: "Sahih al-Bukhari 2742", text: "One-third, and one-third is much." },
  noHeirBequest: { source: "Hadith", reference: "Sunan Abu Dawud 2870", text: "There is no bequest for an heir." },
  childrenShares: { source: "Qurʾan", reference: "An-Nisaʾ 4:11", text: "For the male, what is equal to the share of two females." },
  spouseShares: { source: "Qurʾan", reference: "An-Nisaʾ 4:12", text: "For the wives a quarter… or an eighth if you leave a child." },
};
