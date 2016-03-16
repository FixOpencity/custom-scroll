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
        d.addEventListener( EVENT_MOVE, this.handlers._moveScrollBar );
        d.addEventListener( EVENT_END_MOVE, this.handlers._moveEndScrollBar );

        this.container.addEventListener( EVENT_START_MOVE, this.handlers._moveStart );
        this.container.addEventListener( EVENT_MOVE, this.handlers._move );
        d.addEventListener( EVENT_END_MOVE, this.handlers._moveEnd );

        this.container.addEventListener( 'transitionend', this.handlers._transitionEnd );

        this.init = true;
    }
    function _destroy () {

        this.container.classList.remove( 'custom-scroll' );

        this.holder.classList.remove( 'custom-scroll__holder' );
        this.holder.style.transform = 'translate3D( 0, 0, 0 )';

        this.scrollBar.parentNode.removeChild( this.scrollBar );

        d.removeEventListener( EVENT_MOVE, this.handlers._moveScrollBar );
        d.removeEventListener( EVENT_END_MOVE, this.handlers._moveEndScrollBar );

        this.container.removeEventListener( EVENT_START_MOVE, this.handlers._moveStart );
        this.container.removeEventListener( EVENT_MOVE, this.handlers._move );
        d.removeEventListener( EVENT_END_MOVE, this.handlers._moveEnd );

        this.container.removeEventListener( 'transitionend', this.handlers._transitionEnd );

        this.init = false;
    }

    // hadlers
    function _moveStart ( e ) {
        e.preventDefault();
        this.startX = e.pageX;
        this.startOffset = _getTransformValues( this.holder )[4];

        console.log( '_moveStart', this.container );
    }
    function _move ( e ) {
        var diff = e.pageX - this.startX;

        if ( !this.startX || this.scrollBarActive ) return;

        this.holder.style.transform = 'translate3D( ' + ( diff + this.startOffset ) + 'px, 0, 0 )';
        this.scrollBar.style.transform = 'translate3D( ' + ( Math.abs( diff + this.startOffset ) * this.ratio ) + 'px, 0, 0 )';
        this.scrollBar.classList.add( 'custom-scroll__bar_move' );

        console.log( '_move', this.container );
    }
    function _moveEnd ( e ) {
        var values = _getTransformValues( this.holder );
        this.startX = 0;
        this.scrollBar.classList.remove( 'custom-scroll__bar_move' );

        if ( values[4] > 0 ) {
            this.holder.style.transitionDuration = '.1s';
            this.scrollBar.style.transform = this.holder.style.transform = 'translate3D( 0, 0, 0 )';
        } else if ( values[4] < this.maxOffset ) {
            this.holder.style.transitionDuration = '.1s';
            this.holder.style.transform = 'translate3D( ' + this.maxOffset + 'px, 0, 0 )';
            this.scrollBar.style.transform = 'translate3D( ' + Math.abs( this.maxOffset * this.ratio ) + 'px, 0, 0 )';
        }

        console.log( '_moveEnd', this.container );
    }

    function _moveStartScrollBar ( e ) {
        e.stopPropagation();
        e.preventDefault();
        this.scrollBarActive = true;
        this.startX = e.pageX;
        this.startOffset = _getTransformValues( this.scrollBar )[4];
        this.scrollBar.classList.add( 'custom-scroll__bar_active' );

        console.log( '_moveStartScrollBar', this.container );
    }
    function _moveScrollBar ( e ) {
        var diff = e.pageX - this.startX;
        e.stopPropagation();

        if ( !this.startX || !this.scrollBarActive ) return;

        this.scrollBar.style.transform = 'translate3D( ' + ( diff + this.startOffset ) + 'px, 0, 0 )';
        this.holder.style.transform = 'translate3D( ' + ( - ( diff + this.startOffset ) / this.ratio ) + 'px, 0, 0 )';

        console.log( '_moveScrollBar', this.container );
    }
    function _moveEndScrollBar ( e ) {
        e.stopPropagation();
        this.scrollBarActive = false;
        this.startX = 0;
        this.scrollBar.classList.remove( 'custom-scroll__bar_active' );

        console.log( '_moveEndScrollBar', this.container );
    }

    function _transitionEnd ( e ) {
        e.stopPropagation();
        this.holder.style.transitionDuration = '0ms';

        console.log( '_transitionEnd' );
    }

    /**
     * updateCustomScroll
     * @param params { before : function(){}, after : function(){} }
     */
    CustomScroll.prototype.update = function updateCustomScroll ( params ) {
        if ( params.before && typeof params.before === 'function' ) {
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

        if ( params.after && typeof params.after === 'function' ) {
            params.after( this.container );
        }
    };

    CustomScroll.prototype.destroy = function () { _destroy.call( this ); };

    // init
    function CustomScroll ( selector ) {
        this.container = d.querySelector( selector );
        this.ratio = this.container.getBoundingClientRect().width / this.container.scrollWidth;

        if ( this.ratio >= 1 || this.init ) {
            return this;
        } else {
            _init.call( this );
        }
    }

    w.CustomScroll = CustomScroll;
} )( window, document );
