import { Composition } from 'remotion';
import { TechLingoVideo } from './Video';
import timeline from './timeline.json';
import './fonts';

export const RemotionRoot = () => (
  <>
    <Composition id="Vertical" component={TechLingoVideo} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1080} height={1920} />
    <Composition id="Landscape" component={TechLingoVideo} durationInFrames={timeline.durationInFrames} fps={timeline.fps} width={1920} height={1080} />
  </>
);
