import React, { useContext, useState, useEffect, useRef } from 'react'
import Progress from './Progress'
import { ProgressContext, GlobalCtx, StoriesContext as StoriesContextInterface } from './../interfaces'
import ProgressCtx from './../context/Progress'
import GlobalContext from './../context/Global'
import StoriesContext from './../context/Stories'

export default () => {
    const [count, setCount] = useState<number>(0)
    const { currentId, next, videoDuration, pause } = useContext<ProgressContext>(ProgressCtx)
    const { defaultInterval, onStoryEnd, onStoryStart, onAllStoriesEnd } = useContext<GlobalCtx>(GlobalContext);
    const { stories } = useContext<StoriesContextInterface>(StoriesContext);
    useEffect(() => {
        setCount(0)
    }, [currentId, stories])

    useEffect(() => {
        if (!pause) {
            animationFrameId.current = requestAnimationFrame(incrementCount)
        }
        return () => {
            cancelAnimationFrame(animationFrameId.current)
        }
    }, [currentId, pause])

    let animationFrameId = useRef<number>()
    let startTimestamp: undefined | number = undefined;
    let previousTimestamp = 0;
    const incrementCount = (ms: number) => {
        if(startTimestamp === undefined) {
            startTimestamp = ms;
        }
        const elapsed = ms - startTimestamp;
        const interval = getCurrentInterval()

        if (elapsed === 0) {
            storyStartCallback();
        }
        setCount(() => {
            if(previousTimestamp !== ms) {
                // spread elapsed time since start over the current interval, multiply by 100 to get in % of completion
                return elapsed / interval * 100;
            }
        });
        if(elapsed < interval) {
            previousTimestamp = ms;
            animationFrameId.current = requestAnimationFrame(incrementCount)
        } else {
            startTimestamp = undefined;
            previousTimestamp = 0;
            storyEndCallback();
            if (currentId === stories.length - 1) {
                allStoriesEndCallback();
            }
            cancelAnimationFrame(animationFrameId.current);
            next();
        }
    }

    const storyStartCallback = () => {
        onStoryStart && onStoryStart(currentId, stories[currentId])
    }

    const storyEndCallback = () => {
        onStoryEnd && onStoryEnd(currentId, stories[currentId])
    }

    const allStoriesEndCallback = () => {
        onAllStoriesEnd && onAllStoriesEnd(currentId, stories)
    }

    const getCurrentInterval = () => {
        if (stories[currentId].type === 'video') return videoDuration
        if (typeof stories[currentId].duration === 'number') return stories[currentId].duration
        return defaultInterval
    }

    return (
        <div style={styles.progressArr}>
            {stories.map((_, i) =>
                <Progress
                    key={i}
                    count={count}
                    width={1 / stories.length}
                    active={i === currentId ? 1 : (i < currentId ? 2 : 0)}
                />)}
        </div>
    )
}

const styles = {
    progressArr: {
        display: 'flex',
        justifyContent: 'center',
        maxWidth: '100%',
        flexWrap: 'row',
        position: 'absolute',
        width: '98%',
        padding: 5,
        paddingTop: 7,
        alignSelf: 'center',
        zIndex: 99,
        filter: 'drop-shadow(0 1px 8px #222)'
    }
}