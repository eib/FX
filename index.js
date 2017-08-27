const createAnimitter = require('animitter/index.js');

class FX {
    constructor(ctx) {
        this.ctx = ctx;
        this.elapsedTime = 0;
        this.renderables = [];
        this.updatables = [];
        this.isPlaying = false;
        this.isPaused = false;

        this.loop = createAnimitter((frameCount, deltaTime) => {
            const tick = {
                frames: frameCount,
                deltaMillis: deltaTime,
                totalMillis: this.elapsedTime + deltaTime
            };
            this.update(tick);
            this.render(this.ctx, tick);
            this.elapsedTime += deltaTime;
        });
    }

    update(tick) {
        this.updateAll(tick);
        if ((tick.frames % this.framesBeforePruning) === 0) {
            this.pruneTerminatedObjects();
        }
    }

    addObjects(objects) {
        objects.forEach(this.addObject, this);
    }

    addObject(obj) {
        if (typeof obj.render === 'function') {
            this.renderables.push(obj);
        }
        if (typeof obj.update === 'function') {
            this.updatables.push(obj);
        }
        if (this.isPaused) {
            this.resume();
        }
    }

    render(ctx, tick) {
        if (this.clearCanvas) {
            this.clear(ctx);
        }
        this.renderAll(ctx, tick);
    }

    updateAll(tick) {
        this.updatables.forEach(function (obj) {
            if (!obj.isTerminated) {
                if (obj.update(tick) === false) {
                    obj.isTerminated = true;
                }
            }
        });
    }

    clear(ctx) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);
    }

    renderAll(ctx, tick) {
        this.renderables.forEach(function (obj) {
            if (!obj.isTerminated) {
                obj.render(ctx, tick);
            }
        });
    }

    pruneTerminatedObjects() {
        [this.renderables, this.updatables].forEach(function (collection, ii) {
            for (let ii = collection.length - 1; ii >= 0; ii--) {
                let obj = collection[ii];
                if (obj.isTerminated) {
                    collection.splice(ii, 1);
                }
            }
        });
        if (this.renderables.length === 0 && this.updatables.length === 0) {
            this.pause();
        }
    }

    start() {
        console.log('Starting animation loop...');
        this.loop.start();
        this.isPlaying = true;
    }

    stop() {
        this.loop.stop();
        this.isPlaying = false;
        console.log('Stopped.');
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    pause() {
        if (this.isPlaying) {
            console.log('Pausing...');
            this.stop();
            this.isPaused = true;
        }
    }

    resume() {
        if (this.isPaused) {
            console.log('Resumed.');
            this.start();
            this.isPaused = false;
        }
    }

    onTick(callback) {
        this.loop.on('update', function (frameCount, deltaTime) {
            const tick = {
                frames: frameCount,
                deltaMillis: deltaTime,
                totalMillis: this.elapsedTime + deltaTime
            };
            callback(tick);
        });
    }
}

FX.prototype.clearCanvas = true;
FX.prototype.canvasSize = { x: 1000, y: 1000 };
FX.prototype.backgroundColor = 'black';
FX.prototype.framesBeforePruning = 100;

module.exports = FX;
