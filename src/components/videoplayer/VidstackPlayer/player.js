"use client"
import React, { useEffect, useRef, useState } from "react";
import "@vidstack/react/player/styles/base.css";
import styles from "./player.module.css";
import {
  MediaPlayer,
  MediaProvider,
  useMediaStore,
  useMediaRemote,
  Track,
  TextTrack,
} from "@vidstack/react";
import { useRouter } from "next/navigation";
import VideoProgressSave from '../../../utils/VideoProgressSave';
import { VideoLayout } from "./components/layouts/video-layout";
// import '@vidstack/react/styles/default/keyboard.css';
import { DefaultVideoKeyboardActionDisplay } from '@vidstack/react/player/layouts/default';
import { ContextSearch } from "../../../context/DataContext";
import '@vidstack/react/player/styles/default/theme.css';
import { updateEp } from "@/lib/EpHistoryfunctions";

function Player({ dataInfo, id, groupedEp, sources, session, savedep,  subtitles, thumbnails, skiptimes}) {
  const { animetitle, nowPlaying, settings} = ContextSearch();
  const { epId, provider, epNum, subtype } = nowPlaying;
  const { previousep, currentep, nextep } = groupedEp;
  const [getVideoProgress, UpdateVideoProgress] = VideoProgressSave();
  const router = useRouter();
  const src = sources?.find(i => i.quality === "default" || i.quality === "auto")?.url || sources?.find(i => i.quality === "1080p")?.url;

  const playerRef = useRef(null);
  const { duration } = useMediaStore(playerRef);
  const remote = useMediaRemote(playerRef);

  const [opbutton, setopbutton] = useState(false);
  const [edbutton, setedbutton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  let interval;

  useEffect(() => {
    playerRef.current?.subscribe(({ currentTime, duration }) => {

      if (skiptimes && skiptimes.length > 0) {
        const opStart = skiptimes[0]?.startTime ?? 0;
        const opEnd = skiptimes[0]?.endTime ?? 0;

        const epStart = skiptimes[1]?.startTime ?? 0;
        const epEnd = skiptimes[1]?.endTime ?? 0;

        const opButtonText = skiptimes[0]?.text || "";
        const edButtonText = skiptimes[1]?.text || "";

        setopbutton(opButtonText === "Opening" && (currentTime > opStart && currentTime < opEnd));
        setedbutton(edButtonText === "Ending" && (currentTime > epStart && currentTime < epEnd));

        if (settings?.autoskip) {
          if (currentTime > opStart && currentTime < opEnd) {
            Object.assign(playerRef.current ?? {}, { currentTime: opEnd });
            return null;
          }
          if (currentTime > epStart && currentTime < epEnd) {
            Object.assign(playerRef.current ?? {}, { currentTime: epEnd });
            return null;
          }
        }
      }

    })

  }, [settings]);

  function onCanPlay() {
    if (skiptimes && skiptimes.length > 0) {
      const track = new TextTrack({
        kind: 'chapters',
        default: true,
        label: 'English',
        language: 'en-US',
        type: 'json'
      });
      for (const cue of skiptimes) {
        track.addCue(new window.VTTCue(Number(cue.startTime), Number(cue.endTime), cue.text))
      }
      playerRef.current.textTracks.add(track);
    }
  }

  function onEnd() {
    // console.log("End")
    setIsPlaying(false);
  }

  function onEnded() {
    if (!nextep?.id) return;
    if (settings?.autonext) {
      router.push(
        `/anime/watch?id=${dataInfo?.id}&host=${provider}&epid=${
          nextep?.id}&ep=${nextep?.number}&type=${subtype}`
      );
    }
  }

  function onPlay() {
    // console.log("play")
    setIsPlaying(true);
  }

  function onPause() {
    // console.log("pause")
    setIsPlaying(false);
  }

  useEffect(() => {
    if (isPlaying) {
      interval = setInterval(async () => {
        const currentTime = playerRef.current?.currentTime
          ? Math.round(playerRef.current?.currentTime)
          : 0;

          await updateEp({
                userName: session?.user?.name,
                aniId: String(dataInfo?.id) || String(id),
                aniTitle: dataInfo?.title?.[animetitle] || dataInfo?.title?.romaji,
                epTitle: currentep?.title || `EP ${epNum}`,
                image: currentep?.img || currentep?.image ||
                       dataInfo?.bannerImage || dataInfo?.coverImage?.extraLarge || '',
                epId: epId,
                epNum: Number(epNum) || Number(currentep?.number),
                timeWatched: currentTime,
                duration: duration,
                provider: provider,
                nextepId: nextep?.id || null,
                nextepNum: nextep?.number || null,
                subtype: subtype
              })

        UpdateVideoProgress(dataInfo?.id || id, {
          aniId: String(dataInfo?.id) || String(id),
          aniTitle: dataInfo?.title?.[animetitle] || dataInfo?.title?.romaji,
          epTitle: currentep?.title || `EP ${epNum}`,
          image: currentep?.img || currentep?.image ||
                 dataInfo?.bannerImage || dataInfo?.coverImage?.extraLarge || '',
          epId: epId,
          epNum: Number(epNum) || Number(currentep?.number),
          timeWatched: currentTime,
          duration: duration,
          provider: provider,
          nextepId: nextep?.id || null,
          nextepNum: nextep?.number || null,
          subtype: subtype,
          createdAt: new Date().toISOString(),
        });
      }, 5000);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, duration]);

  function onLoadedMetadata() {
    if(savedep && savedep[0]){
      const seekTime = savedep[0]?.timeWatched;
      if(seekTime){
        remote.seek(seekTime-3);
      }
    }
    else{
    const seek = getVideoProgress(dataInfo?.id);
    if (seek?.epNum === Number(epNum)) {
      const seekTime = seek?.timeWatched;
      const percentage = duration !== 0 ? seekTime / Math.round(duration) : 0;

      if (percentage >= 0.95) {
        remote.seek(0);
      }else {
        remote.seek(seekTime - 3);
      }
    }
    }
  }

  function onTimeUpdate() {
    const currentTime = playerRef.current?.currentTime;
    const timeToShowButton = duration - 8;
  
    const nextButton = document.querySelector(".nextbtn");
  
    if (nextButton) {
      if (duration !== 0 && (currentTime > timeToShowButton && nextep?.id)) {
        nextButton.classList.remove("hidden");
      } else {
        nextButton.classList.add("hidden");
      }
    }
  }
  

  function handleop() {
    console.log("Skipping Intro");
    Object.assign(playerRef.current ?? {}, { currentTime: skiptimes[0]?.endTime ?? 0 });
  }

  function handleed() {
    console.log("Skipping Outro");
    Object.assign(playerRef.current ?? {}, { currentTime: skiptimes[1]?.endTime ?? 0 });
  }


  return (
    <MediaPlayer key={sources} ref={playerRef} playsInline aspectRatio={16 / 9} load={settings?.load || 'idle'} muted={settings?.audio || false}
      autoFocus={true} autoPlay={settings?.autoplay || false}
     title={currentep?.title || `EP ${epNum}` || 'Loading...'}
    className={`${styles.player} player relative`}
      crossOrigin={"anonymous"}
      streamType="on-demand"
      onEnd={onEnd}
      onEnded={onEnded}
      onCanPlay={onCanPlay}
      src={{
        src: src,
        type: "application/x-mpegurl",
      }}
      onPlay={onPlay}
      onPause={onPause}
      onLoadedMetadata={onLoadedMetadata}
      onTimeUpdate={onTimeUpdate}
    >
      <MediaProvider>
        {subtitles && subtitles?.map((track) => (
          <Track {...track} key={track.src} />
        ))}
      </MediaProvider>
      {opbutton && <button onClick={handleop} className='absolute bottom-[70px] sm:bottom-[83px] right-4 z-[40] bg-white text-black py-2 px-3 rounded-[6px] font-medium text-[15px]'>Skip Opening</button>}
      {edbutton && <button onClick={handleed} className='absolute bottom-[70px] sm:bottom-[83px] right-4 z-[40] bg-white text-black py-2 px-3 rounded-[6px] font-medium text-[15px]'>Skip Ending</button>}
      <VideoLayout
      subtitles={subtitles}
      thumbnails={thumbnails ? process.env.NEXT_PUBLIC_PROXY_URI + thumbnails[0]?.url : ""}
      groupedEp={groupedEp}
    />
    <DefaultVideoKeyboardActionDisplay 
  icons={{
    Play: null,
    Pause: null,
    Mute: null,
    VolumeUp: null,
    VolumeDown: null,
    EnterFullscreen: null,
    ExitFullscreen: null,
    EnterPiP: null,
    ExitPiP: null,
    CaptionsOn: null,
    CaptionsOff: null,
  }} 
/>
    </MediaPlayer>
  )
}

export default Player