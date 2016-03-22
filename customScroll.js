( function ( w, d ) {
    'use strict';

    var EVENT_START_MOVE = 'mousedown',
        EVENT_MOVE = 'mousemove',
        EVENT_END_MOVE = 'mouseup',
        _scrollBar = d.createElement( 'div' );

    //helpers
    function _getTransformValues ( el ) { // https://gist.github.com/EugeneRuzanov/8d4b8cb490311a59d66e
        var transform = w.getComputedStyle( el, null ).getPropertyValue( 'transform' );
        if ( transform !== 'none' ) {
            return transform.split( '(' )[1].split( ')' )[0].split( ',' ).map( function ( val ) { return +val; } );
        }
        return [ 0, 0, 0, 0, 0, 0 ];
    }
    function _normalize () {
        var values = _getTransformValues( this.holder );

        if ( values[4] > 0 ) {
            this.holder.style.transitionDuration = '.1s';
            this.scrollBar.style.transform = this.holder.style.transform = 'translate3D( 0, 0, 0 )';
        } else if ( values[4] < this.maxOffset ) {
            this.holder.style.transitionDuration = '.1s';
            this.holder.style.transform = 'translate3D( ' + ( this.maxOffset >> 0 ) + 'px, 0, 0 )';
            this.scrollBar.style.transform = 'translate3D( ' + Math.abs( this.maxOffset * this.ratio >> 0 ) + 'px, 0, 0 )';
        }
    }
    function _init () {
        this.scrollBar = _scrollBar.cloneNode();
        this.holder = this.container.firstElementChild;
        this.startX = 0;
        this.maxOffset = this.container.getBoundingClientRect().width - this.holder.getBoundingClientRect().width;

        this.container.classList.add( 'custom-scroll' );
        this.holder.classList.add( 'custom-scroll__holder' );
        this.scrollBar.classList.add( 'custom-scroll__bar' );
        this.scrollBar.style.width = this.container.getBoundingClientRect().width * this.ratio + 'px';
        this.container.appendChild( this.scrollBar );

        this.handlers = {
            _moveStartScrollBar : _moveStartScrollBar.bind( this ),
            _moveScrollBar : _moveScrollBar.bind( this ),
            _moveEndScrollBar : _moveEndScrollBar.bind( this ),
            _moveStart : _moveStart.bind( this ),
            _move : _move.bind( this ),
            _moveEnd : _moveEnd.bind( this ),
            _transitionEnd : _transitionEnd.bind( this )
        };

        this.scrollBar.addEventListener( EVENT_START_MOVE, this.handlers._moveStartScrollBar );
        this.container.addEventListener( EVENT_START_MOVE, this.handlers._moveStart );
        this.container.addEventListener( 'transitionend', this.handlers._transitionEnd );

        this.init = true;
    }
    function _destroy () {

        this.container.classList.remove( 'custom-scroll' );

        this.holder.classList.remove( 'custom-scroll__holder' );
        this.holder.style.transform = 'translate3D( 0, 0, 0 )';

        this.scrollBar.parentNode.removeChild( this.scrollBar );

        this.container.removeEventListener( EVENT_START_MOVE, this.handlers._moveStart );
        this.container.removeEventListener( 'transitionend', this.handlers._transitionEnd );

        this.init = false;
    }

    // hadlers
    function _moveStart ( e ) {
        e.preventDefault(); // fix for chrome DnD
        if ( this.scrollBarActive ) return;
        this.startX = e.pageX;
        this.startOffset = _getTransformValues( this.holder )[4];
        d.addEventListener( EVENT_MOVE, this.handlers._move );
        d.addEventListener( EVENT_END_MOVE, this.handlers._moveEnd );
    }
    function _move ( e ) {
        var diff = e.pageX - this.startX;
        if ( !this.startX ) return;
        this.holder.style.transform = 'translate3D( ' + ( diff + this.startOffset >> 0 ) + 'px, 0, 0 )';
        this.scrollBar.style.transform = 'translate3D( ' + ( Math.abs( diff + this.startOffset ) * this.ratio >> 0 ) + 'px, 0, 0 )';
        this.scrollBar.classList.add( 'custom-scroll__bar_move' );
    }
    function _moveEnd ( e ) {
        this.startX = 0;
        this.scrollBar.classList.remove( 'custom-scroll__bar_move' );
        _normalize.call( this );
        d.removeEventListener( EVENT_MOVE, this.handlers._move );
        d.removeEventListener( EVENT_END_MOVE, this.handlers._moveEnd );
    }

    function _moveStartScrollBar ( e ) {
        e.preventDefault(); // fix for chrome DnD
        this.scrollBarActive = true;
        this.startX = e.pageX;
        this.startOffset = _getTransformValues( this.scrollBar )[4];
        this.scrollBar.classList.add( 'custom-scroll__bar_active' );
        d.addEventListener( EVENT_MOVE, this.handlers._moveScrollBar );
        d.addEventListener( EVENT_END_MOVE, this.handlers._moveEndScrollBar );
    }
    function _moveScrollBar ( e ) {
        var diff = e.pageX - this.startX;
        if ( !this.startX ) return;
        this.scrollBar.style.transform = 'translate3D( ' + ( diff + this.startOffset >> 0 ) + 'px, 0, 0 )';
        this.holder.style.transform = 'translate3D( ' + ( - ( diff + this.startOffset ) / this.ratio >> 0 ) + 'px, 0, 0 )';
    }
    function _moveEndScrollBar () {
        this.scrollBarActive = false;
        this.startX = 0;
        this.scrollBar.classList.remove( 'custom-scroll__bar_active' );
        _normalize.call( this );
        d.removeEventListener( EVENT_MOVE, this.handlers._moveScrollBar );
        d.removeEventListener( EVENT_END_MOVE, this.handlers._moveEndScrollBar );
    }

    function _transitionEnd ( e ) {
        e.stopPropagation();
        this.holder.style.transitionDuration = '0ms';
    }

    /**
     * updateCustomScroll
     * @param params { before : function(){}, after : function(){} }
     */
    CustomScroll.prototype.update = function updateCustomScroll ( params ) {
        if ( params && params.before && typeof params.before === 'function' ) {
            params.before( this.container );
        }

        this.ratio = this.container.getBoundingClientRect().width / this.container.scrollWidth;

        if ( this.ratio >= 1 && this.init ) {
            _destroy.call( this );
        } else if ( !this.init ) {
            _init.call( this );
        } else {
            this.maxOffset = this.container.getBoundingClientRect().width - this.holder.getBoundingClientRect().width;
            this.scrollBar.style.width = this.container.getBoundingClientRect().width * this.ratio + 'px';
        }

        if ( params && params.after && typeof params.after === 'function' ) {
            params.after( this.container );
        }
    };

    // todo update scroll when resize viewport

    CustomScroll.prototype.destroy = function () { _destroy.call( this ); };

    /**
     *
     * @param container selector or DOM node
     * @constructor
     */
    function CustomScroll ( container ) {
        this.container = typeof container === 'string' ? d.querySelector( container ) : container;
        this.ratio = this.container.getBoundingClientRect().width / this.container.scrollWidth;
        if ( this.ratio < 1 && !this.init ) _init.call( this );
    }

    w.CustomScroll = CustomScroll;
} )( window, document );
