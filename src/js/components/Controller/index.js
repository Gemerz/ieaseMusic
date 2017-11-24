import React, { Component } from 'react';
import { Link } from 'react-router';
import { inject, observer } from 'mobx-react';
import { ipcRenderer } from 'electron';
import injectSheet from 'react-jss';
import clazz from 'classname';
import MusicBar from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import classes from './classes';
import ProgressImage from 'ui/ProgressImage';
import { PLAYER_LOOP, PLAYER_SHUFFLE, PLAYER_REPEAT } from 'stores/controller';

@inject(stores => ({
    song: stores.controller.song,
    mode: stores.controller.mode,
    next: stores.controller.next,
    prev: stores.controller.prev,
    toggle: stores.controller.toggle,
    playing: stores.controller.playing,
    toPlay: stores.controller.toPlay,
    changeMode: stores.controller.changeMode,
    isLiked: stores.me.isLiked,
    like: stores.me.like,
    unlike: stores.me.unlike,
    setProcess: stores.controller.setProcess,
    resetProcess: stores.controller.resetProcess,
    incrementProcess: stores.controller.incrementProcess,
    process: stores.controller.process,
    volume: stores.controller.volume,
    setVolume: stores.controller.setVolume,
    isMuted: stores.controller.isMuted,
    toggleMuted: stores.controller.toggleMuted,
    getPlayerLink: () => {
        return stores.controller.playlist.link;
    },
    getPlaylistName: () => {
        return `🎉 ${stores.controller.playlist.name}`;
    },
    hasLogin: stores.me.hasLogin,
    showComments: () => stores.comments.toggle(true),
}))
@observer
class Controller extends Component {
    get MusicBarTime() {
        return Math.floor(this.props.song.duration / 1000);
    }
    get MusicVolume() {
        return parseFloat(this.props.volume / 100).toFixed(2);
    }
    formatTimeLabel(time) {
        let length = Math.floor(parseInt(time));
        let minute = Math.floor(time / 60);
        if (minute < 10) {
            minute = '0' + minute;
        }
        let second = length % 60;
        if (second < 10) {
            second = '0' + second;
        }
        return minute + ':' + second;
    }
    handleChange = (value) => {
        this.props.setProcess(value);
        document.querySelector('audio').currentTime = value;
        if (value >= this.MusicBarTime - 1) {
            this.props.resetProcess();
        }
    }
    handleVolumeChange = (value) => {
        this.props.setVolume(value);
    }
    handleVolumeMuted() {
        document.querySelector('audio').volume = 0;
    }
    handleChangeComplete = () => {
        this.props.toPlay();
    }
    autoIcrement = () => {
        this.autoIcrement = setInterval(() => {
            this.props.incrementProcess();
        }, 1000);
    }

    componentWillReceiveProps(props) {
        console.log('v', props.isMuted);
        if (!props.playing && props.process > 0) {
            document.querySelector('audio').currentTime = this.props.process;
        }
        document.querySelector('audio').volume = this.MusicVolume;
        if (props.isMuted) {
            this.handleVolumeMuted();
        }
    }
    componentDidMount() {
        this.timer = setInterval(() => {
            if (this.props.playing) {
                this.props.incrementProcess();
            }
            if (this.props.process >= this.MusicBarTime) {
                this.props.resetProcess();
            }
        }, 1000);

        ipcRenderer.on('player-next', () => {
            this.props.resetProcess();
        });
        ipcRenderer.on('player-previous', () => {
            this.props.resetProcess();
        });
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }
    render() {
        var { classes, song, mode, prev, next, toggle, hasLogin, isLiked, like, unlike, playing, getPlayerLink, getPlaylistName, showComments } = this.props;
        var liked = isLiked(song.id);

        if (!song.id) {
            return false;
        }

        return (
            <div className={`${classes.container} dragarea`}>

                <section>
                    {/* Click the cover show the player screen */}

                    <Link
                        className={`${classes.cover} tooltip`}
                        data-text={getPlaylistName()}
                        to={getPlayerLink()}>
                        <ProgressImage {...{
                            height: 50,
                            width: 50,
                            src: song.album.cover,
                        }} />
                    </Link>
                    <div className={classes.centerBar}>
                        <div className={classes.info}>
                            <div className={classes.infoInner}>
                                <p className={classes.title}>
                                    {/* Click the song name show the album screen */}
                                    <Link to={song.album.link}>
                                        {song.name}
                                    </Link>
                                </p>

                                <p className={classes.author}>
                                    {
                                        song.artists.map((e, index) => {
                                            // Show the artist
                                            return (
                                                <Link
                                                    key={index}
                                                    to={e.link}>
                                                    {e.name}
                                                </Link>
                                            );
                                        })
                                    }
                                </p>
                            </div>

                            <div className={classes.timeLabel}>
                                <span>{this.formatTimeLabel(this.props.process)}/</span>
                                <span>{this.formatTimeLabel(this.MusicBarTime)}</span>
                            </div>
                        </div>
                        {/* <div className={classes.bar} id="progress">
                            <div className={classes.playing} />
                            <div className={classes.buffering} />
                        </div> */}
                        <MusicBar
                            className={classes.processBar}
                            min={0}
                            step={1}
                            tooltip={false}
                            max={this.MusicBarTime}
                            value={this.props.process}
                            onChangeStart={this.handleChangeStart}
                            onChange={this.handleChange}
                            onChangeComplete={this.handleChangeComplete}
                        />

                    </div>
                    <aside>

                        <div className={classes.action}>
                            {
                                (song.data && song.data.isFlac) && (
                                    <span
                                        className={classes.highquality}
                                        title="High Quality Music">
                                        SQ
                                    </span>
                                )
                            }

                            <svg style={{ width: 16, height: 16 }} onClick={e => showComments()} viewBox="0 0 24 24">
                                <path fill="#000000" d="M12,23A1,1 0 0,1 11,22V19H7A2,2 0 0,1 5,17V7C5,5.89 5.9,5 7,5H21A2,2 0 0,1 23,7V17A2,2 0 0,1 21,19H16.9L13.2,22.71C13,22.9 12.75,23 12.5,23V23H12M13,17V20.08L16.08,17H21V7H7V17H13M3,15H1V3A2,2 0 0,1 3,1H19V3H3V15Z" />
                            </svg>
                            {
                                hasLogin() && (
                                    <i
                                        className={clazz('ion-ios-heart', {
                                            [classes.liked]: liked,
                                        })}
                                        onClick={e => liked ? unlike(song) : like(song)} />
                                )
                            }

                            <svg className="loopMode" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" onClick={this.props.changeMode} >
                                <path className={`${mode === PLAYER_SHUFFLE ? 'show' : ''}`} fill="#000000" d="M17,3L22.25,7.5L17,12L22.25,16.5L17,21V18H14.26L11.44,15.18L13.56,13.06L15.5,15H17V12L17,9H15.5L6.5,18H2V15H5.26L14.26,6H17V3M2,6H6.5L9.32,8.82L7.2,10.94L5.26,9H2V6Z" />
                                <path className={`${mode === PLAYER_REPEAT ? 'show' : ''}`} fill="#000000" d="M18.6,6.62C21.58,6.62 24,9 24,12C24,14.96 21.58,17.37 18.6,17.37C17.15,17.37 15.8,16.81 14.78,15.8L12,13.34L9.17,15.85C8.2,16.82 6.84,17.38 5.4,17.38C2.42,17.38 0,14.96 0,12C0,9.04 2.42,6.62 5.4,6.62C6.84,6.62 8.2,7.18 9.22,8.2L12,10.66L14.83,8.15C15.8,7.18 17.16,6.62 18.6,6.62M7.8,14.39L10.5,12L7.84,9.65C7.16,8.97 6.31,8.62 5.4,8.62C3.53,8.62 2,10.13 2,12C2,13.87 3.53,15.38 5.4,15.38C6.31,15.38 7.16,15.03 7.8,14.39M16.2,9.61L13.5,12L16.16,14.35C16.84,15.03 17.7,15.38 18.6,15.38C20.47,15.38 22,13.87 22,12C22,10.13 20.47,8.62 18.6,8.62C17.69,8.62 16.84,8.97 16.2,9.61Z" />
                                <path className={`${mode === PLAYER_LOOP ? 'show' : ''}`} fill="#000000" d="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z" />
                            </svg>

                            <div className={classes.controls}>
                                <svg style={{ width: 38, height: 38 }} onClick={() => {
                                    prev();
                                    this.props.resetProcess();
                                }} viewBox="0 0 24 24">
                                    <path fill="#000000" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M8,8H10V16H8M16,8V16L11,12" />
                                </svg>
                                <span
                                    className={classes.toggle}
                                    onClick={toggle}>
                                    {
                                        playing
                                            ? <svg style={{ width: 50, height: 50 }} viewBox="0 0 24 24">
                                                <path fill="#000000" d="M15,16H13V8H15M11,16H9V8H11M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                            </svg>
                                            : <svg style={{ width: 50, height: 50 }} viewBox="0 0 24 24">
                                                <path fill="#000000" d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                            </svg>
                                    }
                                </span>

                                <svg style={{ width: 38, height: 38 }} viewBox="0 0 24 24"
                                    onClick={() => {
                                        next();
                                        this.props.resetProcess();
                                    }}>
                                    <path fill="#000000" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M8,8L13,12L8,16M14,8H16V16H14" />
                                </svg>

                            </div>
                            <div className="volumeBarContent">
                                <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" onClick={this.props.toggleMuted}>
                                    <path className={`${this.props.isMuted ? '' : 'show'}`} fill="#000000" d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z" />
                                    <path className={`${this.props.isMuted ? 'show' : ''}`} fill="#000000" d="M3,9H7L12,4V20L7,15H3V9M16.59,12L14,9.41L15.41,8L18,10.59L20.59,8L22,9.41L19.41,12L22,14.59L20.59,16L18,13.41L15.41,16L14,14.59L16.59,12Z" />          </svg>
                                <MusicBar
                                    className={'volumeBar'}
                                    min={0}
                                    step={1}
                                    tooltip={true}
                                    max={100}
                                    onChange={this.handleVolumeChange}
                                    value={this.props.isMuted ? 0 : this.props.volume}
                                />
                            </div>

                        </div>
                    </aside>
                </section>
            </div>
        );
    }
}

export default injectSheet(classes)(Controller);
