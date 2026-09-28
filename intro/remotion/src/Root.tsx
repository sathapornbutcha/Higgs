import {Composition} from 'remotion';
import {ClawReveal} from './ClawReveal';

export const Root: React.FC = () => (
  <Composition id="ClawReveal" component={ClawReveal} durationInFrames={300} fps={60} width={1920} height={1080} />
);
