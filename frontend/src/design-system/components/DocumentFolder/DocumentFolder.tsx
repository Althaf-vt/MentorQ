import { useId, type CSSProperties, type Ref } from 'react';
import { cardTiltHandlers } from '../../lib/card-tilt';

export type DocumentFolderItem = { id: string; title: string };

export type DocumentFolderProps<Item extends DocumentFolderItem = DocumentFolderItem> = {
  label: string;
  items: readonly Item[];
  tone?: 'lilac' | 'peach' | 'mint';
  open: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  onToggle: (trigger: HTMLButtonElement) => void;
  onItemClick: (item: Item, trigger: HTMLButtonElement) => void;
};

export function DocumentFolder<Item extends DocumentFolderItem>({ label, items, tone = 'lilac', open, headingRef, onToggle, onItemClick }: DocumentFolderProps<Item>) {
  const filesId = useId();
  const count = items.length;

  return (
    <section className="mqds-folder" data-tone={tone} data-open={open} data-file-count={count}>
      <button type="button" className="mqds-folder-trigger" {...(open ? {} : cardTiltHandlers)}
        aria-expanded={open} aria-controls={filesId} onClick={event => onToggle(event.currentTarget)}>
        <span className="mqds-folder-visual" aria-hidden="true">
          <span className="mqds-folder-back" />
          <span className="mqds-folder-peek">
            {items.slice(0, 3).map((document, index, pages) => (
              <span className="mqds-folder-sheet" key={document.id}
                style={{ '--sheet-slot': index - (pages.length - 1) / 2, '--sheet-order': index } as CSSProperties}>
                <strong>{document.title}</strong>
                <span className="mqds-folder-lines" />
              </span>
            ))}
          </span>
          <span className="mqds-folder-flap" />
        </span>
        <span className="mqds-folder-caption">
          <span><strong>{label}</strong><small>{count} {count === 1 ? 'note' : 'notes'}</small></span>
          <span className="mqds-folder-arrow" aria-hidden="true">{'\u2192'}</span>
        </span>
      </button>
      <div className="mqds-folder-files" id={filesId} hidden={!open}>
        {open && (
          <>
            <h4 ref={headingRef} tabIndex={-1}>{label} notes</h4>
            <ul>
              {items.map((document, index) => (
                <li key={document.id} style={{ '--sheet-order': Math.min(index, 5) } as CSSProperties}>
                  <button className="mqds-file" type="button"
                    onClick={event => onItemClick(document, event.currentTarget)}>
                    <span className="mqds-file-format">{label}</span>
                    <strong>{document.title}</strong>
                    <span className="mqds-file-lines" aria-hidden="true" />
                    <span className="mqds-file-arrow" aria-hidden="true">{'\u2192'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

