import { LEAF_PATH } from './kohlblatt'

interface KohlfeldProps {
  className?: string
}

// Grünkohl-Party: ersetzt die Duesseldorfer Skyline durch ein Kohlfeld in
// einer Frostnacht (Mondsichel, Raureif, Bollerwagen). Gleiches viewBox wie
// die Skyline, damit der Header seine Hoehe behaelt. Rein dekorativ.
function Kohlfeld({ className }: KohlfeldProps) {
  return (
    <svg className={className} viewBox="0 0 320 112" aria-hidden="true" focusable="false">
      <defs>
        <path id="kohlblatt" d={LEAF_PATH} />
        <g id="kohlpflanze">
          <use href="#kohlblatt" transform="rotate(-42) scale(0.9)" />
          <use href="#kohlblatt" transform="rotate(42) scale(0.9)" />
          <use href="#kohlblatt" transform="rotate(-18) scale(1.08)" />
          <use href="#kohlblatt" transform="rotate(18) scale(1.08)" />
          <use href="#kohlblatt" transform="scale(1.3)" />
        </g>
      </defs>
      <g className="kohlfeld-frost">
        <circle cx="262" cy="20" r="9" />
        <rect x="30" y="18" width="1" height="6" />
        <rect x="27.5" y="20.5" width="6" height="1" />
        <rect x="120" y="8" width="1" height="6" />
        <rect x="117.5" y="10.5" width="6" height="1" />
        <rect x="190" y="30" width="1" height="6" />
        <rect x="187.5" y="32.5" width="6" height="1" />
        <rect x="300" y="44" width="1" height="6" />
        <rect x="297.5" y="46.5" width="6" height="1" />
        <circle cx="76" cy="38" r="0.9" />
        <circle cx="160" cy="44" r="0.9" />
        <circle cx="228" cy="12" r="0.9" />
        <circle cx="12" cy="46" r="0.8" />
      </g>
      {/* Aus der vollen Scheibe wird mit der Himmelsfarbe eine Sichel */}
      <circle className="kohlfeld-sky" cx="267" cy="16.5" r="8" />
      <path className="kohlfeld-hill" d="M0,74 Q74,50 156,66 T320,58 V112 H0 Z" />
      <path className="kohlfeld-rime" d="M0,74 Q74,50 156,66 T320,58" />
      <g className="kohlfeld-plant kohlfeld-plant-back">
        <use href="#kohlpflanze" transform="translate(48,82) scale(0.45)" />
        <use href="#kohlpflanze" transform="translate(106,74) scale(0.36)" />
        <use href="#kohlpflanze" transform="translate(168,80) scale(0.4)" />
      </g>
      <g className="kohlfeld-wagon">
        <rect x="200" y="84" width="58" height="16" rx="2" />
        <rect x="205" y="74" width="18" height="11" />
        <rect x="227" y="77" width="13" height="8" />
        <path d="M258,90 L286,78" />
        <circle cx="210" cy="103" r="7" />
        <circle cx="248" cy="103" r="7" />
      </g>
      <path className="kohlfeld-ground" d="M0,100 Q98,86 196,96 T320,92 V112 H0 Z" />
      <g className="kohlfeld-plant">
        <use href="#kohlpflanze" transform="translate(22,112) scale(0.7)" />
        <use href="#kohlpflanze" transform="translate(298,112) scale(0.8)" />
      </g>
    </svg>
  )
}

export default Kohlfeld
