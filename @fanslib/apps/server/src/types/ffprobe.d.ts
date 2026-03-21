declare module "ffprobe" {
  export interface FFProbeStream {
    index: number;
    codec_name?: string;
    codec_long_name?: string;
    profile?: string;
    codec_type: "video" | "audio" | "subtitle" | "data" | "attachment";
    codec_time_base?: string;
    codec_tag_string?: string;
    codec_tag?: string;
    width?: number;
    height?: number;
    coded_width?: number;
    coded_height?: number;
    has_b_frames?: number;
    sample_aspect_ratio?: string;
    display_aspect_ratio?: string;
    pix_fmt?: string;
    level?: number;
    color_range?: string;
    color_space?: string;
    color_transfer?: string;
    color_primaries?: string;
    chroma_location?: string;
    field_order?: string;
    timecode?: string;
    refs?: number;
    is_avc?: string;
    nal_length_size?: string;
    r_frame_rate?: string;
    avg_frame_rate?: string;
    time_base?: string;
    start_pts?: number;
    start_time?: string;
    duration_ts?: number;
    duration?: string;
    bit_rate?: string;
    max_bit_rate?: string;
    bits_per_raw_sample?: string;
    nb_frames?: string;
    nb_read_frames?: string;
    nb_read_packets?: string;
    disposition?: {
      default?: number;
      dub?: number;
      original?: number;
      comment?: number;
      lyrics?: number;
      karaoke?: number;
      forced?: number;
      hearing_impaired?: number;
      visual_impaired?: number;
      clean_effects?: number;
      attached_pic?: number;
      timed_thumbnails?: number;
    };
    tags?: Record<string, string>;
  }

  export interface FFProbeFormat {
    filename?: string;
    nb_streams?: number;
    nb_programs?: number;
    format_name?: string;
    format_long_name?: string;
    start_time?: string;
    duration?: string;
    size?: string;
    bit_rate?: string;
    probe_score?: number;
    tags?: Record<string, string>;
  }

  export interface FFProbeResult {
    streams: FFProbeStream[];
    format: FFProbeFormat;
  }

  function ffprobe(filePath: string): Promise<FFProbeResult>;
  export default ffprobe;
}
