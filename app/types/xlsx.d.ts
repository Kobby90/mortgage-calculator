declare module 'xlsx' {
  export const utils: {
    book_new: () => any;
    aoa_to_sheet: (data: any[][]) => any;
    book_append_sheet: (workbook: any, worksheet: any, name: string) => void;
  };
  export function writeFile(workbook: any, filename: string): void;
} 