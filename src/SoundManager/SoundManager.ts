import {AnimatedSpriteController, Button, Component, Entity, Mouse, System, Timer} from "lagom-engine";
import {LD49} from "../LD49";
import {Layers} from "../Layers";


class MuteComp extends Component
{
}

class MuteListener extends System<[AnimatedSpriteController, MuteComp]>
{
    types = () => [AnimatedSpriteController, MuteComp];

    update(delta: number): void
    {
        this.runOnEntities((e: Entity, spr: AnimatedSpriteController) => {
            if (Mouse.isButtonPressed(Button.LEFT))
            {
                const pos = e.scene.game.renderer.plugins.interaction.mouse.global;

                if (pos.x > 0 && pos.x < 16 && pos.y > 0 && pos.y < 16)
                {
                    (e.scene.getEntityWithName("audio") as SoundManager).toggleMute();
                    spr.setAnimation(Number(LD49.muted));
                }
            }
        });
    }
}

export class SoundManager extends Entity
{
    constructor()
    {
        super("audio", 0, 0, Layers.gameStatus);

        this.startMusic();
    }

    onAdded(): void
    {
        super.onAdded();

        this.addComponent(new MuteComp());
        const spr = this.addComponent(new AnimatedSpriteController(Number(LD49.muted), [
            {
                id: 0,
                textures: this.scene.game.getResource("mute").textures([[0, 0]], 16, 16)
            }, {
                id: 1,
                textures: this.scene.game.getResource("mute").textures([[1, 0]], 16, 16)
            }]));

        this.addComponent(new Timer(50, spr, false)).onTrigger.register((caller, data) => {
            data.setAnimation(Number(LD49.muted));
        });

        this.scene.addSystem(new MuteListener());
    }

    toggleMute()
    {
        LD49.muted = !LD49.muted;

        if (LD49.muted)
        {
            this.stopAllSounds();
        }
        else
        {
            this.startMusic();
        }
    }

    startMusic()
    {
        if (!LD49.muted && !LD49.musicPlaying)
        {
            LD49.audioAtlas.play("music");
            LD49.musicPlaying = true;
        }
    }

    stopAllSounds(music = true)
    {
        if (music)
        {
            LD49.audioAtlas.sounds.forEach((v: any, k: string) => v.stop());
            LD49.musicPlaying = false;
        }
        else
        {
            LD49.audioAtlas.sounds.forEach((v: any, k: string) => {
                if (k !== "music") v.stop();
            });
        }
    }

    onRemoved(): void
    {
        super.onRemoved();
        this.stopAllSounds(false);
    }

    playSound(name: string)
    {
        if (!LD49.muted)
        {
            LD49.audioAtlas.play(name);
        }
    }
}
