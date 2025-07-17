import { useState } from 'react'

export default function StyleToolbar({ onStyleChange }) {
  const [color, setColor] = useState('#000000')
  const [font, setFont] = useState('sans-serif')

  const handleStyle = (style) => {
    onStyleChange((prev) => ({ ...prev, [style]: !prev[style] }))
  }

  const handleColorChange = (e) => {
    setColor(e.target.value)
    onStyleChange((prev) => ({ ...prev, color: e.target.value }))
  }

  const handleFontChange = (e) => {
    setFont(e.target.value)
    onStyleChange((prev) => ({ ...prev, font: e.target.value }))
  }

  return (
    <div className="fixed top-4 right-4 bg-white/90 shadow-md p-4 rounded-lg flex flex-col gap-2 z-50 border">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => handleStyle('bold')} className="font-bold px-2">B</button>
        <button onClick={() => handleStyle('italic')} className="italic px-2">I</button>
        <button onClick={() => handleStyle('strike')} className="line-through px-2">S</button>
      </div>
      <div>
        <label className="text-sm">Text Color:</label>
        <input type="color" value={color} onChange={handleColorChange} />
      </div>
      <div>
        <label className="text-sm">Font:</label>
        <select value={font} onChange={handleFontChange}>
          <option value="sans-serif">Sans</option>
          <option value="serif">Serif</option>
          <option value="monospace">Mono</option>
          <option value="cursive">Cursive</option>
        </select>
      </div>
    </div>
  )
}
