import {Composition} from 'remotion';
import {SnatchPro} from './SnatchPro';

export const Root: React.FC = () => (
  <Composition id="SnatchPro" component={SnatchPro} durationInFrames={300} fps={60} width={1920} height={1080} />
);
