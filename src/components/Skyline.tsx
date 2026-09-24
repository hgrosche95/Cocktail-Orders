interface SkylineProps {
  className?: string
}

// Duesseldorfer Silhouette von links nach rechts: Altbauten, Stadttor,
// Gehry-Bauten im Medienhafen, Rheinturm, Rheinkniebruecke. Rein dekorativ,
// die Farbe kommt ueber `color` (currentColor) aus dem CSS.
function Skyline({ className }: SkylineProps) {
  return (
    <svg className={className} viewBox="0 0 320 112" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <path d="M0 112V80H16V72H32V86H44V112Z" />
        <path fillRule="evenodd" d="M48 112L53 40L78 35L82 112ZM59 112V76H71V112Z" />
        <path d="M86 112V64H98V56H106V112Z" />
        <path d="M110 112V74C114 64 119 68 122 60C126 54 130 63 134 58V112Z" />
        <path d="M137 112V68C141 60 147 66 151 56C155 61 158 68 163 64V112Z" />
        <path d="M167 112V82H186V74H202V112Z" />
        {/* Rheinturm: Schaft, nach oben breiter werdende Kanzel, Betonhals, Antennenmast */}
        <path d="M219.4 112L221.7 41H225.3L227.6 112Z" />
        <path d="M220.6 41L215.2 32.5H231.8L226.4 41Z" />
        <rect x="214.4" y="30.6" width="18.2" height="2.2" rx=".6" />
        <path d="M216.6 30.6L218.2 28.8H228.8L230.4 30.6Z" />
        <path d="M222.1 28.8L222.5 18H224.5L224.9 28.8Z" />
        <rect x="223" y="1.5" width="1" height="17" />
        <path d="M232 112V88H248V80H262V112Z" />
        <rect x="290" y="30" width="4" height="82" />
        <rect x="244" y="97" width="76" height="3" />
        <rect x="0" y="108" width="320" height="4" />
      </g>
      <path
        d="M292 34L256 97M292 40L266 97M292 46L276 97M292 34L320 88M292 40L320 94"
        stroke="currentColor"
        strokeWidth=".7"
      />
      <circle className="skyline-beacon" cx="223.5" cy="1.8" r="1.4" />
      <g className="skyline-lights">
        <rect x="216.8" y="33.6" width="13.4" height="1.4" />
        <rect x="20" y="78" width="2" height="2" />
        <rect x="26" y="90" width="2" height="2" />
        <rect x="62" y="50" width="2" height="2" />
        <rect x="68" y="60" width="2" height="2" />
        <rect x="90" y="70" width="2" height="2" />
        <rect x="100" y="80" width="2" height="2" />
        <rect x="142" y="80" width="2" height="2" />
        <rect x="172" y="88" width="2" height="2" />
        <rect x="190" y="84" width="2" height="2" />
        <rect x="238" y="94" width="2" height="2" />
        <rect x="254" y="88" width="2" height="2" />
      </g>
    </svg>
  )
}

export default Skyline
