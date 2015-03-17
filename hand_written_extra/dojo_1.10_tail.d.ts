// Extra code which is pasted as-is behind the output of dojo-1.10.
declare module dojo {
  module _base {
    // This is copied from Dojo's dojo/_base/fx.js and modified.
    module fx {
    
      /**
       * A generic animation class that fires callbacks into its handlers object at various states.
       *
       * A generic animation class that fires callbacks into its handlers
       * object at various states. Nearly all dojo animation functions
       * return an instance of this method, usually without calling the
       * .play() method beforehand. Therefore, you will likely need to
       * call .play() on instances of `Animation` when one is
       * returned.
       * args: Object
       * The 'magic argument', mixing all the properties into this
       * animation instance.
       */
      class Animation /* extends Evented */ {
        /**
         * The time in milliseconds the animation will take to run
         */
        duration: number;
        
        /**
         * The number of times to loop the animation
         */
        repeat: number;
        
        /**
         * the time in milliseconds to wait before advancing to next frame
         * (used as a fps timer: 1000/rate = fps)
         */
        rate: number;
        
        _percent: number;
        
        _startRepeatCount: number;

        _getStep(): number;
        
        /**
         * Convenience function.  Fire event "evt" and pass it the arguments specified in "args".
         * 
         * Convenience function.  Fire event "evt" and pass it the arguments specified in "args".
         * Fires the callback in the scope of this Animation instance.
         * @param evt The event to fire.
         * @param args The arguments to pass to the event.
         */
    		_fire(evt: Event, args: any[]): void;
        
        /**
  			 * Start the animation.
  			 *
  			 * How many milliseconds to delay before starting.
         *
  			 * @parma gotoStart If true, starts the animation from the beginning; otherwise,
  			 *                   starts it from its current position.
  			 * @return The instance to allow chaining.
         */
        play(delay: number, gotoStart: boolean): Animation;
        _play(gotoStart: boolean): Animation;
        
        pause(): Animation;
        
        gotoPercent(percent: number, andPlay?: boolean): Animation;
        
        stop(gotoEnd?: boolean): Animation;
        
        destroy(): void;
        
        status(): string;
        
        _cycle(): void;
        
        _clearTimer(): void;
        
        _startTimer(): void;
        
        _stopTimer(): void;
      }
    }
  }
}

declare module "dojo/_base/fx" {
  // FIXME Animation should appear here.
}

declare module "dojo/router" {
  var _default: dojo.router.RouterBase;
  export=_default;
}
