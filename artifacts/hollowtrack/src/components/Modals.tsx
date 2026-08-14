import { Check, Trash2, X } from "lucide-react";

import type {
  ModalState,
  Eingabetyp,
  Struktur,
  TrackerDatentyp,
  TrackerTyp,
} from "../types";

export function Modal({
  modal,
  structure,
  name,
  parentId,
  inputType,
  dataType,
  trackerTyp,
  erfassungsart,
  gewichtAktiv,
  trainingsgewicht,
  selbsteinschaetzungAktiv,
  selbsteinschaetzungName,
  setName,
  setParentId,
  setInputType,
  setDataType,
  setTrackerTyp,
  setErfassungsart,
  setGewichtAktiv,
  setTrainingsgewicht,
  setSelbsteinschaetzungAktiv,
  setSelbsteinschaetzungName,
  onClose,
  onSubmit,
}: {
  modal: Exclude<ModalState, null>;
  structure: Struktur;
  name: string;
  parentId: string;
  inputType: Eingabetyp;
  dataType: TrackerDatentyp;
  trackerTyp: TrackerTyp;
  erfassungsart: "einzelwert" | "saetze";
  gewichtAktiv: boolean;
  trainingsgewicht: string;
  selbsteinschaetzungAktiv: boolean;
  selbsteinschaetzungName: string;
  setName: (value: string) => void;
  setParentId: (value: string) => void;
  setInputType: (value: Eingabetyp) => void;
  setDataType: (value: TrackerDatentyp) => void;
  setTrackerTyp: (value: TrackerTyp) => void;
  setErfassungsart: (value: "einzelwert" | "saetze") => void;
  setGewichtAktiv: (value: boolean) => void;
  setTrainingsgewicht: (value: string) => void;
  setSelbsteinschaetzungAktiv: (value: boolean) => void;
  setSelbsteinschaetzungName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isTracker = modal.type === "tracker";
  const isRename = modal.mode === "rename";
  const isMove = modal.mode === "move";
  const categories = structure.kategorien.filter((item) => item.aktiv);
  const areas = structure.bereiche.filter((item) => item.aktiv);
  const views = structure.ansichten.filter((item) => item.aktiv);
  const title = isMove
    ? "Bereich verschieben"
    : isRename
      ? "Element umbenennen"
      : modal.mode === "edit"
        ? modal.type === "kategorie"
          ? "Kategorie bearbeiten"
          : modal.type === "bereich"
            ? "Bereich bearbeiten"
            : "Tracker bearbeiten"
        : modal.type === "kategorie"
          ? "Kategorie anlegen"
          : modal.type === "bereich"
            ? "Bereich anlegen"
            : modal.type === "ansicht"
              ? "Ansicht anlegen"
              : "Tracker anlegen";
  const needsParent =
    isMove ||
    (!isRename &&
      modal.type !== "kategorie" &&
      modal.type !== "tracker");
  const parentOptions = isMove
    ? categories
        .filter((category) => !category.bereichIds.includes(modal.id))
        .map((item) => ({ id: item.id, name: item.name }))
    : modal.type === "bereich"
      ? categories.map((item) => ({ id: item.id, name: item.name }))
      : modal.type === "ansicht"
        ? areas.map((item) => ({ id: item.id, name: item.name }))
        : views.map((item) => ({ id: item.id, name: item.name }));
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="modal-title">
              {title}
            </h2>
            <p className="modal__description">
              {isMove
                ? "Der Bereich bleibt erhalten und wird einer anderen Kategorie zugeordnet."
                : isTracker
                  ? "Tracker werden zentral gespeichert und können mehreren Ansichten zugeordnet werden."
                  : "Änderungen werden direkt auf diesem Gerät gespeichert."}
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Dialog schließen"
          >
            <X size={17} />
          </button>
        </div>
        <form
          className="modal__form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {!isMove ? (
            <label className="field">
              <span className="field__label">Name</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name des Elements"
              />
            </label>
          ) : null}
          {modal.type === "kategorie" &&
          !isRename &&
          !isMove ? (
            <>
              <label className="field">
                <span className="field__label">
                  Selbsteinschätzungs-Notizblock
                </span>
                <select
                  value={selbsteinschaetzungAktiv ? "ja" : "nein"}
                  onChange={(event) =>
                    setSelbsteinschaetzungAktiv(
                      event.target.value === "ja",
                    )
                  }
                >
                  <option value="nein">Nein</option>
                  <option value="ja">Ja</option>
                </select>
              </label>

              {selbsteinschaetzungAktiv ? (
                <label className="field">
                  <span className="field__label">
                    Name des Selbsteinschätzungsblocks
                  </span>
                  <input
                    value={selbsteinschaetzungName}
                    onChange={(event) =>
                      setSelbsteinschaetzungName(
                        event.target.value,
                      )
                    }
                    placeholder="Selbsteinschätzung"
                  />
                </label>
              ) : null}
            </>
          ) : null}

          {needsParent ? (
            <label className="field">
              <span className="field__label">
                {isMove
                  ? "Neue Kategorie"
                  : modal.type === "bereich"
                    ? "Kategorie"
                    : modal.type === "ansicht"
                      ? "Bereich"
                      : "Ansicht"}
              </span>
              <select
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
              >
                {parentOptions.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {isTracker ? (
            <>
              <label className="field">
                <span className="field__label">Trackertyp</span>
                <select
                  value={trackerTyp}
                  onChange={(event) => {
                    const typ = event.target.value as TrackerTyp;
                    setTrackerTyp(typ);

                    if (typ === "training") {
                      setDataType("Messwert");
                      setInputType("Zahl");
                      setErfassungsart("saetze");
                    } else {
                      setErfassungsart("einzelwert");
                    }
                  }}
                >
                  <option value="standard">Standard-Tracker</option>
                  <option value="erinnerung">Erinnerungstracker</option>
                  <option value="training">Trainingstracker</option>
                  <option value="schnellzaehler">Schnellzähler</option>
                </select>
              </label>

              {trackerTyp === "training" ? (
                <>
                  <p className="field__hint">
                    Für Übungen und andere Trainingswerte. Du kannst Werte
                    entweder als Trainingssätze oder als einzelnen Wert erfassen
                    und optional ein Trainingsgewicht hinterlegen.
                  </p>

                  <label className="field">
                    <span className="field__label">Mit Trainingssätzen?</span>
                    <select
                      value={erfassungsart === "saetze" ? "ja" : "nein"}
                      onChange={(event) =>
                        setErfassungsart(
                          event.target.value === "ja"
                            ? "saetze"
                            : "einzelwert",
                        )
                      }
                    >
                      <option value="ja">Ja</option>
                      <option value="nein">Nein</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="field">
                    <span className="field__label">Datentyp</span>
                    <select
                      value={dataType}
                      onChange={(event) =>
                        setDataType(event.target.value as TrackerDatentyp)
                      }
                    >
                      <option>Messwert</option>
                      <option>Ereignis</option>
                      <option>Notiz</option>
                    </select>
                  </label>

                  <label className="field">
                    <span className="field__label">Eingabetyp</span>
                    <select
                      value={inputType}
                      onChange={(event) =>
                        setInputType(event.target.value as Eingabetyp)
                      }
                    >
                      {[
                        "Zahl",
                        "Dezimalzahl",
                        "Text",
                        "Mehrzeiliger Text",
                        "Ja/Nein",
                        "Bewertung 0 bis 10",
                        "Auswahlliste",
                        "Datum",
                        "Uhrzeit",
                        "Dauer",
                        "Mehrfachauswahl",
                      ].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </>
          ) : null}
          {isTracker && trackerTyp === "training" ? (
            <>
              <label className="field">
                <span className="field__label">Trainingsgewicht erfassen?</span>
                <select
                  value={gewichtAktiv ? "ja" : "nein"}
                  onChange={(event) => {
                    const aktiv = event.target.value === "ja";
                    setGewichtAktiv(aktiv);

                    if (!aktiv) {
                      setTrainingsgewicht("");
                    }
                  }}
                >
                  <option value="nein">Nein</option>
                  <option value="ja">Ja</option>
                </select>
              </label>
            </>
          ) : null}
          <div className="modal__actions">
            <button
              className="button button--quiet"
              type="button"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button
              className="button button--primary"
              type="submit"
              disabled={(!isMove && !name.trim()) || (needsParent && !parentId)}
            >
              <Check size={15} />
              Speichern
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function DeleteModal({
  name,
  onClose,
  onConfirm,
}: {
  name: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal modal--confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="delete-title">
              Element löschen?
            </h2>
            <p className="modal__description">
              „{name}“ wird aus der lokalen Struktur entfernt. Die Daten des
              globalen Trackers bleiben erhalten, bis der Tracker selbst
              gelöscht wird.
            </p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Dialog schließen"
          >
            <X size={17} />
          </button>
        </div>
        <div className="modal__actions">
          <button
            className="button button--quiet"
            type="button"
            onClick={onClose}
          >
            Abbrechen
          </button>
          <button
            className="button button--danger"
            type="button"
            onClick={onConfirm}
          >
            <Trash2 size={15} />
            Löschen
          </button>
        </div>
      </section>
    </div>
  );
}
