import { useRef } from 'react';
import { Upload } from 'lucide-react';

type JsonFilePickerProps = {
  onFile: (file: File) => void;
};

export function JsonFilePicker({ onFile }: JsonFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        className="button"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={15} />
        JSON-Datei importieren
      </button>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </>
  );
}
