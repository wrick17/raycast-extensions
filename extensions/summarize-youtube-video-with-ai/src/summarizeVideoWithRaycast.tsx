import nodeFetch from "node-fetch";
(globalThis.fetch as typeof globalThis.fetch) = nodeFetch as never;

import { showToast, Toast, type LaunchProps } from "@raycast/api";
import { useEffect, useState } from "react";
import ActionRaycastFollowUp from "./components/raycast/ActionRaycastFollowUp";
import { useRaycastSummary } from "./components/raycast/hooks/useRaycastSummary";
import SummaryDetails from "./components/summary/SummaryDetails";
import { ALERT } from "./const/toast_messages";
import { useGetVideoUrl } from "./hooks/useGetVideoUrl";
import { getVideoData, type VideoDataTypes } from "./utils/getVideoData";
import { getVideoTranscript } from "./utils/getVideoTranscript";

interface SummarizeVideoWithRaycastProps {
  video: string | undefined | null;
}
export type RaycastPreferences = {
  creativity: "0" | "0.5" | "1" | "1.5" | "2";
  language: string;
};

export default function SummarizeVideoWithRaycast(
  props: LaunchProps<{
    arguments: SummarizeVideoWithRaycastProps;
    launchContext?: { video: string };
  }>,
) {
  const [summary, setSummary] = useState<string | undefined>();
  const [summaryIsLoading, setSummaryIsLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string | undefined>();
  const [videoData, setVideoData] = useState<VideoDataTypes>();
  const [videoURL, setVideoURL] = useState<string | null | undefined>(props.arguments.video);

  useGetVideoUrl({ input: props.arguments.video || props.launchContext?.video, setVideoURL }).then((url) =>
    setVideoURL(url),
  );

  useEffect(() => {
    if (!videoURL) return;
    getVideoData(videoURL)
      .then(setVideoData)
      .catch((error) => {
        showToast({
          style: Toast.Style.Failure,
          title: ALERT.title,
          message: "Error fetching video data: " + error.message,
        });
      });
    getVideoTranscript(videoURL)
      .then(setTranscript)
      .catch((error) => {
        showToast({
          style: Toast.Style.Failure,
          title: ALERT.title,
          message: "Error fetching video transcript: " + error.message,
        });
      });
  }, [videoURL]);

  useRaycastSummary({ transcript, setSummaryIsLoading, setSummary });

  if (!videoData || !transcript) return null;
  const { thumbnail, title } = videoData;

  const markdown = summary
    ? `${summary}

![${title}](${thumbnail?.url})
  `
    : undefined;

  return (
    <SummaryDetails
      AskFollowUpQuestion={ActionRaycastFollowUp}
      markdown={markdown}
      setSummary={setSummary}
      summaryIsLoading={summaryIsLoading}
      transcript={transcript}
      videoData={videoData}
    />
  );
}
