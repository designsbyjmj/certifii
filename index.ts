export interface TextField {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  autoWidth: boolean;
}

export interface CertificateData {
  [key: string]: string;
}

export interface Template {
  file: File;
  url: string;
  width: number;
  height: number;
}

export type Step = 'upload' | 'design' | 'data' | 'generate';