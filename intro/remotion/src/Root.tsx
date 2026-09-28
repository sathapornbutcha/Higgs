import {Composition} from 'remotion';
import {ClawReveal} from './ClawReveal';
import {ElementsIntro} from './ElementsIntro';

export const Root: React.FC = () => (
  <>
    <Composition id="ElementsIntro" component={ElementsIntro} durationInFrames={360} fps={60} width={1920} height={1080} />
    <Composition id="ClawReveal" component={ClawReveal} durationInFrames={300} fps={60} width={1920} height={1080} />
  </>
);
