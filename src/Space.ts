/*! Pts.js is licensed under Apache License 2.0. Copyright © 2017-current William Ngan and contributors. (https://github.com/williamngan/pts) */

import {Pt, Bound} from "./Pt";
import {Form} from "./Form";
import {UIPointerActions as UIA}  from "./UI";
import {ITimer, ISpacePlayers, IPlayer, AnimateCallbackFn, TouchPointsKey} from "./Types";


/**
* Space is an abstract class that represents a general context for expressing Pts. It's extended through subclasses such as [`CanvasSpace`](#link) and [`SVGSpace`](#link). You can also create your own extension of Space.
* See [Space guide](../guide/Space-0500.html) for details.
*/
export abstract class Space {
  
  id: string = "space";
  protected bound: Bound = new Bound();
  
  protected _time: ITimer = { prev: 0, diff: 0, end: -1, min: 0 };
  protected players:ISpacePlayers = {};
  protected playerCount = 0;
  protected _ctx:any;
  
  private _animID:number = -1;
  
  private _pause:boolean = false;
  private _refresh:boolean = undefined;
  private _renderFunc: (context:any, self:Space) => null;
  
  protected _pointer:Pt = new Pt();

  protected _isReady = false;
  protected _playing = false;

  protected _keyDownBind: (evt:KeyboardEvent) => boolean;
  protected _keyUpBind: (evt:KeyboardEvent) => boolean;
  
  
  /**
  * Set whether the rendering should be repainted on each frame.
  * @param b a boolean value to set whether to repaint each frame
  */
  refresh( b:boolean ):this {
    this._refresh = b;
    return this;
  }


  /**
   * Set a minimum frame time
   * @param ms at least this amount of miniseconds must have elapsed before frame advances
   */
  minFrameTime( ms:number=0 ) {
    this._time.min = ms;
  }
  
  
  /**
  * Add an [`IPlayer`](#link) object or a [`AnimateCallbackFn`](#link) callback function to handle events in this Space. An IPlayer is an object with the following callback functions:    
  * - required: `animate: fn( time, ftime, space )` 
  * - optional: `start: fn(bound, space)`   
  * - optional: `resize: fn( size, event )`
  * - optional: `action: fn( type, x, y, event )`  
  * Subclasses of Space may define other callback functions.
  * @param player an [`IPlayer`](#link) object with animate function, or a callback function `fn(time, ftime)`. 
  */
  add( p:IPlayer|AnimateCallbackFn ):this {
    let player:IPlayer = (typeof p == "function") ? { animate: p } : p;
    
    let k = this.playerCount++;
    let pid = this.id + k;
    
    this.players[pid] = player;
    player.animateID = pid;
    if (player.resize && this.bound.inited) player.resize( this.bound ); 
    
    // if _refresh is not set, set it to true
    if (this._refresh === undefined) this._refresh = true;
    
    return this;
  }
  
  
  /**
  * Remove a player from this Space.
  * @param player an IPlayer that has an `animateID` property
  */
  remove( player:IPlayer ):this {
    delete this.players[ player.animateID ];
    return this;
  }
  
  
  /**
  * Remove all players from this Space.
  */
  removeAll():this {
    this.players = {};
    return this;
  }
  
  
  /**
  * Main play loop. This implements `window.requestAnimationFrame` and calls it recursively. 
  * You may override this `play()` function to implement your own animation loop.
  * @param time current time
  */
  play( time=0 ):this {
    // make sure only one play loop is active 
    if (time === 0 && this._animID !== -1) {
      return;
    }
    this._animID = requestAnimationFrame( this.play.bind(this) );
    if (this._pause) return this;
    
    this._time.diff = time - this._time.prev;
    if (this._time.diff < this._time.min) return this;
    this._time.prev = time;
    
    try {
      this.playItems( time );
    } catch (err) {
      cancelAnimationFrame( this._animID );
      this._animID = -1;
      this._playing = false;
      throw err;
    }
    
    return this;
  }
  
  
  /**
  * Replay the animation after [`Space.stop`](#link). This resets the end-time counter. 
  * You may also use [`Space.pause`](#link) and [`resume`](#link) for temporary pause.
  */
  replay() {
    this._time.end = -1;
    this.play();
  }
  
  
  /**
  * Main animate function. This calls all the items to perform.
  * @param time current time
  */
  protected playItems( time: number ) {

    this._playing = true;
    
    // clear before draw if refresh is true
    if (this._refresh) this.clear();
    
    // animate all players
    if (this._isReady) {
      for (let k in this.players) {
        if (this.players[k].animate) this.players[k].animate( time, this._time.diff, this );
      }
    }
    
    // stop if time ended
    if (this._time.end >= 0 && time > this._time.end) {
      cancelAnimationFrame( this._animID );
      this._animID = -1;
      this._playing = false;
    }
  }
  
  
  /**
  * Pause the animation.
  * @param toggle a boolean value to set if this function call should be a toggle (between pause and resume)
  */
  pause( toggle=false ):this {
    this._pause = (toggle) ? !this._pause : true;
    return this;
  }
  
  
  /**
  * Resume the pause animation.
  */
  resume():this {
    this._pause = false;
    return this;
  }
  
  
  /**
  * Specify when the animation should stop: immediately, after a time period, or never stops.
  * @param t a value in millisecond to specify a time period to play before stopping, or `-1` to play forever, or `0` to end immediately. Default is 0 which will stop the animation immediately.
  */
  stop( t=0 ):this {
    this._time.end = t;
    return this;
  }
  
  
  /**
  * Play animation loop once. Optionally set a `duration` time to play for that specific duration.
  * @param duration a value in millisecond to specify a time period to play before stopping, or `-1` to play forever
  */
  playOnce( duration=0 ):this {
    this.play();
    this.stop( duration );
    return this;
  }
  
  /**
  * Custom rendering.
  * @param context rendering context
  */
  protected render( context:any ):this {
    if (this._renderFunc) this._renderFunc( context, this );
    return this;
  }
  
  
  /**
  * Set a custom rendering function `fn(graphics_context, canvas_space)` if needed.
  */
  set customRendering( f:(context:any, self:Space) => null ) { this._renderFunc = f; }
  get customRendering():(context:any, self:Space) => null { return this._renderFunc; }
  

  /**
   * Indicate whether the animation is playing.
   */
  get isPlaying():boolean { return this._playing; }


  /**
  * The outer bounding box which includes its positions.
  */
  get outerBound():Bound { return this.bound.clone(); }
  
  
  /**
  * The inner bounding box of the space, excluding its positions.
  */
  public get innerBound():Bound { return new Bound( Pt.make( this.size.length, 0 ), this.size.clone() ); }
  
  
  /**
  * The size of this space's bounding box.
  */
  get size():Pt { return this.bound.size.clone(); }
  
  
  /**
  * The center of this space's bounding box.
  */
  get center():Pt { return this.size.divide(2); }
  
  
  /**
  * The width of this space's bounding box.
  */
  get width():number { return this.bound.width; }
  
  
  /**
  * The height of this space's bounding box.
  */
  get height():number { return this.bound.height; }
  
  
  /**
   * Resize the space. To be implemented in subclasses.
   * @param b a Bound representing the position and size of the space
   * @param evt event
   */
  abstract resize( b:Bound, evt?:Event ):this;
  
  
  /**
  * clear all contents in the space. To be implemented in subclasses.
  */
  abstract clear():this;
  
  
  /**
  * Get a default form for drawing in this space. To be implemented in subclasses.
  */
  abstract getForm():Form;
  
}




/**
 * MultiTouchSpace is an abstract class that extends [`Space`](#link) to support user interactions via touch events. 
 * It's extended through subclasses such as [`CanvasSpace`](#link) and [`SVGSpace`](#link). 
 */
export abstract class MultiTouchSpace extends Space {
  
  // track mouse dragging
  protected _pressed = false;
  protected _dragged = false;
  
  protected _hasMouse = false;
  protected _hasTouch = false;
  protected _hasKeyboard = false;
  
  // accept subclasses that implements addEventListener, removeEventListener, dispatchEvent
  protected _canvas:EventTarget;
  
  /**
  * Get the mouse or touch pointer that stores the last action.
  */
  public get pointer():Pt {
    let p = this._pointer.clone();
    p.id = this._pointer.id;
    return p;
  }
  
  /**
  * Bind event listener in canvas element. You can also use [`MultiTouchSpace.bindMouse`](#link) or [`MultiTouchSpace.bindTouch`](#link) to bind mouse or touch events conveniently.
  * @param evt an event string such as "mousedown"
  * @param callback callback function for this event
  * @param options options for [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener).
  * @param customTarget If needed, this is an optional parameter to set another event target that's not the canvas element itself. See [Technical Notes guide](/guide/Technical-notes-9000.html) for use cases.
  */
  bindCanvas( evt:string, callback:EventListener, options:any={}, customTarget?:Element ) {
    const target = customTarget ? customTarget : this._canvas;
    target.addEventListener( evt, callback, options );
  }
  
  
  /**
  * Unbind a callback from the event listener.
  * @param evt an event string such as "mousedown"
  * @param callback callback function to unbind
  * @param options options for [removeEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener). This should match the options set in bindCanvas.
  * @param customTarget If customTarget is set in bindCanvas, you'll need to pass the same instance here to unbind
  */
  unbindCanvas( evt:string, callback:EventListener, options:any={}, customTarget?:Element ) {
    const target = customTarget ? customTarget : this._canvas;
    target.removeEventListener( evt, callback, options );
  }
  

  bindDoc( evt:string, callback:EventListener, options:any={} ) {
    if (document) {
      document.addEventListener( evt, callback, options );
    }
  }

  unbindDoc( evt:string, callback:EventListener, options:any={} ) {
    if (document) {
      document.removeEventListener( evt, callback, options );
    }
  }
  

  /**
  * A convenient method to bind (or unbind) all mouse events in canvas element. 
  * All [`IPlayer`](#link) objects added to this space that implement an `action` callback property will receive mouse event callbacks. 
  * The types of mouse actions are defined by [`UIPointerActions`](#link) constants: "up", "down", "move", "drag", "drop", "over", and "out". 
  * @param bind a boolean value to bind mouse events if set to `true`. If `false`, all mouse events will be unbound. Default is true.
  * @param customTarget If needed, this is an optional parameter to set another event target that's not the canvas element itself. See [Technical Notes guide](/guide/Technical-notes-9000.html) for use cases.
  * @see [`Space.add`](#link) 
  */
  bindMouse( bind:boolean=true, customTarget?:Element ):this {
    if ( bind) {
      this._mouseDown = this._mouseDown.bind(this);
      this._mouseUp = this._mouseUp.bind(this);
      this._mouseOver = this._mouseOver.bind(this);
      this._mouseOut = this._mouseOut.bind(this);
      this._mouseMove = this._mouseMove.bind(this);
      this._mouseClick = this._mouseClick.bind(this);
      this._contextMenu = this._contextMenu.bind(this);

      this.bindCanvas( "mousedown", this._mouseDown, {}, customTarget );
      this.bindCanvas( "mouseup", this._mouseUp, {}, customTarget );
      this.bindCanvas( "mouseover", this._mouseOver, {}, customTarget);
      this.bindCanvas( "mouseout", this._mouseOut, {}, customTarget );
      this.bindCanvas( "mousemove", this._mouseMove, {}, customTarget );
      this.bindCanvas( "click", this._mouseClick, {}, customTarget );
      this.bindCanvas( "contextmenu", this._contextMenu, {}, customTarget );
      this._hasMouse = true;
    } else {
      this.unbindCanvas( "mousedown", this._mouseDown, {}, customTarget );
      this.unbindCanvas( "mouseup", this._mouseUp, {}, customTarget );
      this.unbindCanvas( "mouseover", this._mouseOver, {}, customTarget );
      this.unbindCanvas( "mouseout", this._mouseOut, {}, customTarget );
      this.unbindCanvas( "mousemove", this._mouseMove, {}, customTarget );
      this.unbindCanvas( "click", this._mouseClick, {}, customTarget );
      this.unbindCanvas( "contextmenu", this._contextMenu, {}, customTarget );
      this._hasMouse = false;
    }
    return this;
  }
  
  
  /**
  * A convenient method to bind (or unbind) all touch events in canvas element. 
  * All [`IPlayer`](#link) objects added to this space that implement an `action` callback property will receive touch event callbacks. 
  * The types of mouse actions are defined by [`UIPointerActions`](#link) constants: "up", "down", "move", "drag", "drop", "over", and "out". 
  * @param bind a boolean value to bind touch events if set to `true`. If `false`, all mouse events will be unbound. Default is true.
  * @param passive a boolean value to set passive mode, ie, it won't block scrolling. Default is false.
  * @param customTarget If needed, this is an optional parameter to set another event target that's not the canvas element itself. See [Technical Notes guide](/guide/Technical-notes-9000.html) for use cases.
  * @see [`Space.add`](#link)
  */
  bindTouch( bind:boolean=true, passive:boolean=false, customTarget?:Element ):this {
    if (bind) {
      this.bindCanvas( "touchstart", this._touchStart.bind(this), {passive: passive}, customTarget );
      this.bindCanvas( "touchend", this._mouseUp.bind(this), {}, customTarget );
      this.bindCanvas( "touchmove", this._touchMove.bind(this), {passive: passive}, customTarget  );
      this.bindCanvas( "touchcancel", this._mouseOut.bind(this), {}, customTarget );
      this._hasTouch = true;
    } else {
      this.unbindCanvas( "touchstart", this._touchStart.bind(this), {passive: passive}, customTarget );
      this.unbindCanvas( "touchend", this._mouseUp.bind(this), {}, customTarget );
      this.unbindCanvas( "touchmove", this._touchMove.bind(this), {passive: passive}, customTarget );
      this.unbindCanvas( "touchcancel", this._mouseOut.bind(this), {}, customTarget );
      this._hasTouch = false;
    }
    return this;
  }
  

  bindKeyboard( bind:boolean=true ):this {
    if (bind) {
      this._keyDownBind = this._keyDown.bind(this);
      this._keyUpBind = this._keyUp.bind(this);
      this.bindDoc( "keydown", this._keyDownBind, {} );
      this.bindDoc( "keyup", this._keyUpBind, {} );
      this._hasKeyboard = true;
    } else {
      this.unbindDoc( "keydown", this._keyDownBind, {} );
      this.unbindDoc( "keyup", this._keyUpBind, {} );
      this._hasKeyboard = false;
    }
    return this;
  }
  
  
  
  /**
  * A convenient method to convert the touch points in a touch event to an array of Pts.
  * @param evt a touch event which contains touches, changedTouches, and targetTouches list
  * @param which a string to select a touches list: "touches", "changedTouches", or "targetTouches". Default is "touches"
  * @return an array of Pt, whose origin position (0,0) is offset to the top-left of this space
  */
  touchesToPoints( evt:TouchEvent, which:TouchPointsKey="touches" ): Pt[] {
    if (!evt || !evt[which]) return [];
    let ts = [];
    for (var i=0; i<evt[which].length; i++) {
      let t = evt[which].item(i);
      ts.push( new Pt( t.pageX - this.bound.topLeft.x, t.pageY - this.bound.topLeft.y ) );
    }
    return ts;
  }
  
  
  /**
  * Go through all the added [`IPlayer`](#link) objects and call its `action` callback function.
  * @param type an UIPointerActions constant or string: "up", "down", "move", "drag", "drop", "over", and "out"
  * @param evt mouse or touch event
  * @see [`Space.add`](#link)
  */
  protected _mouseAction( type:string, evt:MouseEvent|TouchEvent ) {
    if (!this.isPlaying) return;

    let px = 0, py = 0;
    
    if (evt instanceof MouseEvent) {
      for (let k in this.players) {
        if (this.players.hasOwnProperty(k)) {
          let v = this.players[k];
          px = evt.offsetX;
          py = evt.offsetY;
          if (v.action) v.action( type, px, py, evt );
        }
      }
    } else {
      for (let k in this.players) {
        if (this.players.hasOwnProperty(k)) {
          let v = this.players[k];
          let c = evt.changedTouches && evt.changedTouches.length > 0;
          let touch = evt.changedTouches.item(0);
          px = (c) ? touch.pageX - this.outerBound.x : 0;
          py = (c) ? touch.pageY - this.outerBound.y : 0;
          if (v.action) v.action( type, px, py, evt );
        }
      }
    }
    if (type) {
      if ("_pixelScale" in this) {
        px *= (this as { _pixelScale: number })._pixelScale;
        py *= (this as { _pixelScale: number })._pixelScale;
      }

      this._pointer.to( px, py );
      this._pointer.id = type;
    }
  }
  
  
  /**
  * MouseDown handler.
  * @param evt 
  */
  protected _mouseDown( evt:MouseEvent|TouchEvent ) {
    this._mouseAction( UIA.down, evt );
    this._pressed = true;
    return false;
  }
  
  
  /**
  * MouseUp handler.
  * @param evt 
  */
  protected _mouseUp( evt:MouseEvent|TouchEvent ) {
    if (this._dragged) {
      this._mouseAction( UIA.drop, evt );
    } else {
      this._mouseAction( UIA.up, evt );
    }
    this._pressed = false;
    this._dragged = false;
    return false;
  }
  
  
  /**
  * MouseMove handler.
  * @param evt 
  */
  protected _mouseMove( evt:MouseEvent|TouchEvent ) {
    this._mouseAction( UIA.move, evt );
    if (this._pressed) {
      this._dragged = true;
      this._mouseAction( UIA.drag, evt );
    }
    return false;
  }
  
  
  /**
  * MouseOver handler.
  * @param evt 
  */
  protected _mouseOver( evt:MouseEvent|TouchEvent ) {
    this._mouseAction( UIA.over, evt );
    return false;
  }
  
  
  /**
  * MouseOut handler.
  * @param evt 
  */
  protected _mouseOut( evt:MouseEvent|TouchEvent ) {
    this._mouseAction( UIA.out, evt );
    if (this._dragged) this._mouseAction( UIA.drop, evt );
    this._dragged = false;
    return false;
  }


  /**
  * MouseClick handler.
  * @param evt 
  */
  protected _mouseClick( evt:MouseEvent|TouchEvent ) {
    this._mouseAction( UIA.click, evt );
    this._pressed = false;
    this._dragged = false;
    return false;
  }
    
  
  /**
  * ContextMenu handler.
  * @param evt 
  */
  protected _contextMenu( evt:MouseEvent ) {
    this._mouseAction( UIA.contextmenu, evt );
    return false;
  }
  
  
  /**
  * TouchMove handler.
  * @param evt 
  */
  protected _touchMove( evt:TouchEvent) {
    this._mouseMove(evt);
    evt.preventDefault();
    return false;
  }

  /**
  * TouchStart handler.
  * @param evt 
  */
  protected _touchStart( evt:TouchEvent) {
    this._mouseDown(evt);
    evt.preventDefault();
    return false;
  }


  protected _keyDown( evt:KeyboardEvent ) {
    this._keyboardAction( UIA.keydown, evt );
    return false;
  }

  protected _keyUp( evt:KeyboardEvent ) {
    this._keyboardAction( UIA.keyup, evt );
    return false;
  }

  protected _keyboardAction( type:string, evt:KeyboardEvent ) {
    if (!this.isPlaying) return;
    for (let k in this.players) {
      if (this.players.hasOwnProperty(k)) {
        let v = this.players[k];
        if (v.action) v.action( type, evt.shiftKey ? 1 : 0, evt.altKey ? 1 : 0, evt );
      }
    }
  }
  
}
