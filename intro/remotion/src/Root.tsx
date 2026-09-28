import {Composition} from 'remotion';
import {Anime} from './Anime';
import {Cinematic} from './Cinematic';
import {ClawReveal} from './ClawReveal';
import {Cute} from './Cute';
import {ElementsIntro} from './ElementsIntro';
import {Esports} from './Esports';

const V = {fps: 60, width: 1920, height: 1080};

export const Root: React.FC = () => (
  <>
    <Composition id="ElementsIntro" component={ElementsIntro} durationInFrames={360} {...V} />
    <Composition id="Esports" component={Esports} durationInFrames={300} {...V} />
    <Composition id="Anime" component={Anime} durationInFrames={330} {...V} />
    <Composition id="Cinematic" component={Cinematic} durationInFrames={360} {...V} />
    <Composition id="Cute" component={Cute} durationInFrames={300} {...V} />
    <Composition id="ClawReveal" component={ClawReveal} durationInFrames={300} {...V} />
  </>
);
