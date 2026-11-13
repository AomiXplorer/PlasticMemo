/** Turns story tokens into pixels. Holds no narrative state of its own. */
export class SceneRenderer {
  constructor(root, { background, sprites, audio, dialogue, onFx }) {
    this.root = root;
    this.background = background;
    this.sprites = sprites;
    this.audio = audio;
    this.dialogue = dialogue;
    this.onFx = onFx;
  }

  apply(node, { instant = false } = {}) {
    switch (node.t) {
      case 'bg':
        this.background.set(node.id, { instant });
        break;
      case 'show':
        this.sprites.show(node.who, node.expr ?? 'neutral', node.pos ?? 'center', { instant });
        break;
      case 'expr':
        this.sprites.setExpression(node.who, node.expr);
        break;
      case 'hide':
        this.sprites.hide(node.who);
        break;
      case 'move':
        this.sprites.move(node.who, node.pos);
        break;
      case 'bgm':
        this.audio.playBgm(node.id);
        break;
      case 'amb':
        this.audio.playAmb(node.id);
        break;
      case 'sfx':
        this.audio.playSfx(node.id);
        break;
      case 'fx':
        this.onFx?.(node.id, { instant });
        break;
      default:
        break;
    }
  }

  reset() {
    this.background.reset();
    this.sprites.clear();
    this.dialogue.clear();
  }
}
