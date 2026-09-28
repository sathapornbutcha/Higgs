import {Composition} from 'remotion';
import {Anime} from './Anime';
import {Cinematic} from './Cinematic';
import {ClawReveal} from './ClawReveal';
import {Cute} from './Cute';
import {Draw} from './Draw';
import {ElementsIntro} from './ElementsIntro';
import {Esports} from './Esports';
import {Card} from './Card';
import {Chest} from './Chest';
import {CoinFlip} from './CoinFlip';
import {Gacha} from './Gacha';
import {Heist} from './Heist';
import {Kinetic} from './Kinetic';

const V = {fps: 30, width: 1920, height: 1080};

export const Root: React.FC = () => (
  <>
    <Composition id="Chest" component={Chest} durationInFrames={300} {...V} />
    <Composition id="Gacha" component={Gacha} durationInFrames={300} {...V} />
    <Composition id="CoinFlip" component={CoinFlip} durationInFrames={300} {...V} />
    <Composition id="Heist" component={Heist} durationInFrames={300} {...V} />
    <Composition id="Card" component={Card} durationInFrames={300} {...V} />
    <Composition id="Kinetic" component={Kinetic} durationInFrames={300} {...V} />
    <Composition id="ElementsIntro" component={ElementsIntro} durationInFrames={300} {...V} />
    <Composition id="Draw" component={Draw} durationInFrames={300} {...V} />
    <Composition id="Esports" component={Esports} durationInFrames={300} {...V} />
    <Composition id="Anime" component={Anime} durationInFrames={300} {...V} />
    <Composition id="Cinematic" component={Cinematic} durationInFrames={300} {...V} />
    <Composition id="Cute" component={Cute} durationInFrames={300} {...V} />
    <Composition id="ClawReveal" component={ClawReveal} durationInFrames={300} fps={60} width={1920} height={1080} />
  </>
);
