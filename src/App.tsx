import Atelier from './atelier/Atelier';
import { StudioVessel } from './art/StudioVessel';
import { DEFAULT_DESIGN, GLAZES, PROFILES } from './art/model';

const Arrow = ({diagonal = false}: {diagonal?: boolean}) => <span aria-hidden="true">{diagonal ? '↗' : '↗'}</span>;

function StudioMark({className = ''}: {className?: string}) {
  return <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M10 65h60M16 59V32a24 24 0 0 1 48 0v27M26 59V33a14 14 0 0 1 28 0v26M37 59V34a3 3 0 0 1 6 0v25" stroke="currentColor" strokeWidth="2"/><path d="M32 8 40 1l8 7" stroke="currentColor" strokeWidth="2"/></svg>;
}

function App() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header" id="top">
      <a href="#top" className="wordmark" aria-label="KILN home">KILN<span className="wordmark-dot" aria-hidden="true">✳</span></a>
      <p className="header-note">A study in<br/>earth & possibility.</p>
      <nav aria-label="Main navigation"><a href="#forms">The forms</a><a href="#process">Our process</a><a className="nav-atelier" href="#atelier">Enter the atelier <Arrow/></a></nav>
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="tiny-disc"/> INDEPENDENT CERAMIC EXPLORATIONS</p>
          <h1 id="hero-title">Form,<br/><span>feeling,</span><br/>fire<span className="title-stop">.</span></h1>
          <div className="hero-bottom"><p>Objects with a little soul.<br/>Made of earth. Shaped by you.</p><a className="round-link" href="#atelier" aria-label="Enter the interactive atelier"><Arrow/></a></div>
        </div>
        <div className="hero-stage">
          <span className="stage-index">STUDY NO. 03 / MOON</span>
          <span className="stage-script" aria-hidden="true">a softer kind<br/>of permanence</span>
          <div className="hero-sculpture"><StudioVessel design={{...DEFAULT_DESIGN,profile:'moon'}} priority className="hero-vessel" label="Original sculptural Moon vessel in deep indigo glaze"/></div>
          <span className="stage-cross" aria-hidden="true">+</span><p className="stage-caption">EARTHEN FORM<br/>DIGITAL EXPRESSION</p>
          <a href="#forms" className="stage-link">Meet the collection <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-foot"><span>THE KILN JOURNAL — VOLUME 001</span><span>IMPERFECT BY NATURE. <span aria-hidden="true">✳</span> INDIVIDUAL BY DESIGN.</span><a href="#manifesto">A different perspective <span aria-hidden="true">↓</span></a></div>
      </section>

      <section className="manifesto section-shell" id="manifesto" aria-labelledby="manifesto-title">
        <div className="section-label"><span>01 / THE PHILOSOPHY</span><StudioMark/></div>
        <div className="manifesto-body"><h2 id="manifesto-title">A vessel holds more<br/>than <em>what’s inside.</em></h2><div className="manifesto-text"><p>It holds a gesture. A moment of curiosity. The space between something useful and something you simply want to live with.</p><p>KILN is an imaginary studio for very real exploration. We work at the meeting point of ancient material and digital play — where a small change can make a form entirely your own.</p></div></div>
      </section>

      <section className="forms section-shell" id="forms" aria-labelledby="forms-title">
        <div className="section-heading"><div><p className="eyebrow">02 / THE FORM LIBRARY</p><h2 id="forms-title">Three starting points.<br/><em>Endless character.</em></h2></div><p className="section-intro">Not a collection to collect.<br/>A collection to make your own.</p></div>
        <div className="form-grid">{PROFILES.map((profile,index) => <article className={`form-study form-study-${index}`} key={profile.id}><div className="form-art"><span className="form-number">0{index+1}</span><StudioVessel design={{...DEFAULT_DESIGN,profile:profile.id,glaze:GLAZES[index === 0 ? 0 : index === 1 ? 2 : 1].id}} label={`${profile.name} ceramic form study`}/><span className="form-axis" aria-hidden="true">↕</span></div><div className="form-description"><h3>{profile.name}</h3><p>{profile.note}</p><a href="#atelier" aria-label={`Explore ${profile.name} and other forms in the atelier`}><Arrow/></a></div></article>)}</div>
      </section>

      <section className="process" id="process" aria-labelledby="process-title">
        <div className="process-art" aria-label="Original abstract illustration of clay layers, a coil and a shaping tool" role="img"><div className="clay-orbit orbit-one"/><div className="clay-orbit orbit-two"/><div className="clay-orbit orbit-three"/><div className="clay-block block-one"/><div className="clay-block block-two"/><div className="wood-tool"/><span className="material-note">RAW MATERIAL /<br/>UNLIMITED POTENTIAL</span><span className="process-stamp">KILN<br/><small>MATERIAL STUDIES</small></span></div>
        <div className="process-copy"><p className="eyebrow">03 / SLOW IDEAS, NEW TOOLS</p><h2 id="process-title">From earth.<br/>Through hands.<br/><em>Into possibility.</em></h2><p>Clay teaches us to pay attention. To the curve of a shoulder. The weight of a base. The quiet tension of an open rim.</p><p>Our digital atelier borrows that spirit. Begin with a form, follow your instinct, and see where it takes you.</p><ol className="process-steps"><li><span>01</span> Find your form</li><li><span>02</span> Follow the curve</li><li><span>03</span> Leave your mark</li></ol></div>
      </section>

      <section className="glazes section-shell" aria-labelledby="glazes-title"><div className="section-heading"><div><p className="eyebrow">04 / THE GLAZE NOTES</p><h2 id="glazes-title">Colour you can <em>feel.</em></h2></div><p className="section-intro">Four digital finishes, inspired by<br/>minerals, ash and the evening sky.</p></div><div className="glaze-grid">{GLAZES.map((glaze,i)=><div className="glaze-study" key={glaze.id}><div className="glaze-tile" style={{'--glaze':glaze.color} as React.CSSProperties}><span aria-hidden="true">✳</span></div><div><span className="glaze-index">G / 0{i+1}</span><h3>{glaze.name}</h3><p>{glaze.note}</p></div></div>)}</div></section>

      <Atelier/>

      <section className="closing section-shell" aria-labelledby="closing-title"><p className="eyebrow">NO PERFECT ANSWERS. JUST GOOD CURIOSITY.</p><h2 id="closing-title">Make room<br/>for <em>possibility.</em><span aria-hidden="true">✳</span></h2><div className="closing-bottom"><StudioMark/><p>A small, fictional studio.<br/>A place to try something.</p><a href="#atelier">Back to the atelier <Arrow/></a></div></section>
    </main>
    <footer className="site-footer"><a className="footer-wordmark" href="#top" aria-label="KILN back to top">KILN</a><div><p>AN INDEPENDENT DIGITAL CONCEPT · 2026</p><p>Original forms & code. No objects for sale.<br/>Digital studies are artistic explorations, not fabrication plans.</p></div><a href="https://github.com/seoshiro/kiln-atelier" target="_blank" rel="noreferrer">Open studio / source <Arrow/></a></footer>
  </>;
}
export default App;
