interface OptionsBase {
    /**
     *  The video element to attach listeners to
     */
    video?: HTMLVideoElement,

    /**
     *  The canvas to render the subtitles to.
     *  If none is given it will create a new canvas and insert it as a sibling of the video element (only if the video element exists)
     */
    canvas?: HTMLCanvasElement,

    /**
     * The URL of the worker
     *
     * @default `subtitles-octopus-worker.js`
     */
    workerUrl?: string,

    /**
     * The URL of the legacy worker
     *
     * @default `subtitles-octopus-worker-legacy.js`
     */
    legacyWorkerUrl?: string,

    /**
     * An array of links to the fonts used in the subtitle
     */
    fonts?: string[]

    /**
     * Object with all available fonts - Key is font name in lower case, value is link
     *
     * @example `{"arial": "/font1.ttf"}`
     */
    availableFonts?: Record<string, string>

    /**
     * The amount of time the subtitles should be offset from the video
     *
     * @default 0
     */
    timeOffset?: number

    /**
     * Whether performance info is printed in the console
     *
     * @default false
     */
    debug?: boolean

    /**
     * Function that's called when SubtitlesOctopus is ready
     */
    onReady?: () => void

    /**
     * Function called in case of critical error meaning the subtitles wouldn't be shown
     * and you should use an alternative method (for instance it occurs if browser doesn't support web workers)
     */
    onError?: () => void


    /**
     * Enable Fast Render Mode (Lossy)
     *
     * This is experimental feature
     *
     * @default false
     * @see https://github.com/libass/JavascriptSubtitlesOctopus#fast-render-mode-lossy-experimental
     */
    lossyRender?: boolean
}

interface OptionsWithSubUrl extends OptionsBase {
    subUrl: string
}

interface OptionsWithSubContent extends OptionsBase {
    subContent: string
}

export type Options = OptionsWithSubUrl | OptionsWithSubContent

declare class SubtitlesOctopus {
    constructor(options: Options)

    /**
     * Render subtitles at specified time
     * @param time
     */
    setCurrentTime(time: number): void



    /**
     * Works the same as the {@link subUrl} option. It will set the subtitle to display by its URL.
     * @param url
     */
    setTrackByUrl(url: string): void



    /**
     * Works the same as the {@link subContent} option. It will set the subtitle to display by its content.
     * @param content
     */
    setTrack(content: string): void



    /**
     * This simply removes the subtitles.
     * You can use {@link setTrackByUrl} or {@link setTrack} methods to set a new subtitle file to be displayed.
     */
    freeTrack(): void



    /**
     * Destroy instance
     */
    dispose(): void
}

export default SubtitlesOctopus
