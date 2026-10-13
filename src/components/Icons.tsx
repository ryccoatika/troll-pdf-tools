import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const PressIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 3h16M7 3v4h10V3M12 7v3" />
    <rect x="5" y="10" width="14" height="3" rx="1" />
    <path d="M7 17h10M5 21h14M8 17v-2.5M16 17v-2.5" />
  </svg>
);

export const LaserIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M12 3v18" strokeDasharray="2 2.2" />
    <path d="M9 8l-2 2 2 2M15 8l2 2-2 2" />
  </svg>
);

export const FuseIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="9" height="12" rx="1.5" transform="rotate(-8 7.5 11)" />
    <rect x="12" y="5" width="9" height="12" rx="1.5" transform="rotate(8 16.5 11)" />
    <path d="M12 21l-2-2m2 2l2-2m-2 2v-5" />
  </svg>
);

export const SoundOn = (p: P) => (
  <svg {...base} {...p}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
  </svg>
);

export const SoundOff = (p: P) => (
  <svg {...base} {...p}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" />
    <path d="M22 9l-6 6M16 9l6 6" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
);

export const FileIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 118 0v3" />
  </svg>
);

export const SparkIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
    <path d="M4 20h16" />
  </svg>
);

export const Logo = (p: P) => (
  <svg width={28} height={28} viewBox="0 0 28 28" {...p}>
    <rect width="28" height="28" rx="8" fill="#ffb020" />
    <rect x="6" y="5" width="16" height="3" rx="1" fill="#111" />
    <rect x="7" y="17" width="14" height="4.5" rx="1" fill="#111" />
    <rect x="8.5" y="18.3" width="11" height="1" rx=".5" fill="#ffb020" />
    <rect x="8.5" y="20" width="7" height="1" rx=".5" fill="#ffb020" />
    <path d="M14 8v6" stroke="#111" strokeWidth="2" />
    <rect x="6" y="13.5" width="16" height="2" rx="1" fill="#111" />
  </svg>
);
