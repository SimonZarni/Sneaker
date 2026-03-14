import React, { useState } from "react";

const SIZE_DATA = {
    mens: [
        { us: "4",   eu: "36",   uk: "3.5" },
        { us: "4.5",  eu: "37",   uk: "4"   },
        { us: "5",    eu: "37.5", uk: "4.5" },
        { us: "5.5",  eu: "38",   uk: "5"   },
        { us: "6",    eu: "38.5", uk: "5.5" },
        { us: "6.5",  eu: "39",   uk: "6"   },
        { us: "7",    eu: "40",   uk: "6.5" },
        { us: "7.5",  eu: "40.5", uk: "7"   },
        { us: "8",    eu: "41",   uk: "7.5" },
        { us: "8.5",  eu: "42",   uk: "8"   },
        { us: "9",    eu: "42.5", uk: "8.5" },
        { us: "9.5",  eu: "43",   uk: "9"   },
        { us: "10",   eu: "44",   uk: "9.5" },
        { us: "10.5", eu: "44.5", uk: "10"  },
        { us: "11",   eu: "45",   uk: "10.5"},
        { us: "11.5", eu: "45.5", uk: "11"  },
        { us: "12",   eu: "46",   uk: "11.5"},
        { us: "13",   eu: "47",   uk: "12.5"},
    ],
    womens: [
        { us: "5",    eu: "35.5", uk: "2.5" },
        { us: "5.5",  eu: "36",   uk: "3"   },
        { us: "6",    eu: "36.5", uk: "3.5" },
        { us: "6.5",  eu: "37",   uk: "4"   },
        { us: "7",    eu: "37.5", uk: "4.5" },
        { us: "7.5",  eu: "38",   uk: "5"   },
        { us: "8",    eu: "38.5", uk: "5.5" },
        { us: "8.5",  eu: "39",   uk: "6"   },
        { us: "9",    eu: "40",   uk: "6.5" },
        { us: "9.5",  eu: "40.5", uk: "7"   },
        { us: "10",   eu: "41",   uk: "7.5" },
        { us: "10.5", eu: "41.5", uk: "8"   },
        { us: "11",   eu: "42",   uk: "8.5" },
        { us: "12",   eu: "43",   uk: "9.5" },
    ],
    kids: [
        { us: "1",    eu: "32",   uk: "13"  },
        { us: "1.5",  eu: "33",   uk: "1"   },
        { us: "2",    eu: "33.5", uk: "1.5" },
        { us: "2.5",  eu: "34",   uk: "2"   },
        { us: "3",    eu: "35",   uk: "2.5" },
        { us: "3.5",  eu: "35.5", uk: "3"   },
        { us: "4",    eu: "36",   uk: "3.5" },
        { us: "4.5",  eu: "36.5", uk: "4"   },
        { us: "5",    eu: "37",   uk: "4.5" },
        { us: "5.5",  eu: "37.5", uk: "5"   },
        { us: "6",    eu: "38",   uk: "5.5" },
        { us: "6.5",  eu: "38.5", uk: "6"   },
        { us: "7",    eu: "39",   uk: "6.5" },
    ],
};

type TabKey = keyof typeof SIZE_DATA;

interface SizeGuideProps {
    onClose: () => void;
}

export default function SizeGuideModal({ onClose }: SizeGuideProps) {
    const [tab, setTab] = useState<TabKey>("mens");

    const tabs: { key: TabKey; label: string }[] = [
        { key: "mens",   label: "Men's"   },
        { key: "womens", label: "Women's" },
        { key: "kids",   label: "Kids'"   },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col z-10">

                {/* Header */}
                <div className="border-b border-brand-surface px-8 py-6 flex items-start justify-between gap-4 shrink-0">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-slate/30 mb-1">
                            Fit Reference
                        </p>
                        <h3 className="text-xl font-black uppercase tracking-tight">
                            Size Guide
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-brand-slate/30 hover:text-brand-charcoal transition-colors mt-1 shrink-0"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-brand-surface px-8 flex gap-0 shrink-0">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`py-4 px-6 text-[9px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                                tab === t.key
                                    ? "border-brand-charcoal text-brand-charcoal"
                                    : "border-transparent text-brand-slate/30 hover:text-brand-slate/60"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-y-auto flex-1">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-brand-charcoal text-white">
                            <tr>
                                {["US", "EU", "UK"].map(h => (
                                    <th
                                        key={h}
                                        className="py-4 text-[9px] font-black uppercase tracking-[0.3em] text-center"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SIZE_DATA[tab].map((row, i) => (
                                <tr
                                    key={row.us}
                                    className={`border-b border-brand-surface ${
                                        i % 2 === 0 ? "bg-white" : "bg-brand-surface/30"
                                    }`}
                                >
                                    <td className="py-4 text-center text-xs font-black tabular-nums">
                                        {row.us}
                                    </td>
                                    <td className="py-4 text-center text-xs font-bold tabular-nums text-brand-slate/70">
                                        {row.eu}
                                    </td>
                                    <td className="py-4 text-center text-xs font-bold tabular-nums text-brand-slate/70">
                                        {row.uk}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Measure tip */}
                <div className="border-t border-brand-surface px-8 py-5 bg-brand-surface/20 shrink-0">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-slate/40 mb-2">
                        How to Measure
                    </p>
                    <p className="text-[10px] font-medium text-brand-slate/60 leading-relaxed">
                        Place your foot flat on paper, mark heel and longest toe, then measure the distance in cm. If you're between sizes, go half a size up for comfort.
                    </p>
                </div>
            </div>
        </div>
    );
}
