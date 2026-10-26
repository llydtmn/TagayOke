import YouTubePlayer from './YouTubePlayer';
import DemoStage from './DemoStage';
import IdleTV from './IdleTV';

export default function Stage({ item, roomCode, onEnded }) {
  if (!item) {
    return (
      <div className="stage idle">
        <IdleTV roomCode={roomCode} />
      </div>
    );
  }
  const { song, singer } = item;
  return (
    <div className="stage">
      <div className="stage-screen">
        {song.youtubeId
          ? <YouTubePlayer key={item.id} videoId={song.youtubeId} onEnded={onEnded} />
          : <DemoStage key={item.id} song={song} onEnded={onEnded} />}
      </div>
      <div className="now">
        <span className="chip">#{song.code}</span>
        <div><h2>{song.title}</h2><p className="muted">{song.artist} · sung by {singer}</p></div>
      </div>
    </div>
  );
}