/* This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */


// this controller takes care of all UI elements available
// in the video browser. the corresponding view is VideoBrowser.html

jCinema.views.VideoBrowserController = function () {
	
	// private variables
	var coversUl;
	var numColumns;
	var numRows;
	var items;
	var currentFirstItem;
	
	// private helper methods
	
	function getCellSize() {
		// make sure there are enough li's present
		coversUl.append('<li class="tmp"><img src=""/></li>');
		
		var cellWidth = $('li.tmp', coversUl).outerWidth();
		var cellHeight = $('li.tmp', coversUl).outerHeight();
		
		// and remove the tmp li again
		$('li.tmp', coversUl).remove();
		
		return { width: cellWidth, height: cellHeight };
	}
	
	function getNumColumns() {
		if (numColumns === undefined) {
			// calculate number of columns
			numColumns = Math.floor(coversUl.outerWidth() / getCellSize().width);
		}
		return numColumns;
	};
	
	function getNumRows() {
		if (numRows === undefined) {
			// calculate number of columns
			numRows = Math.floor($(window).height() / getCellSize().height);
		}
		return numRows;
	};
	
	function populateCoverGrid(startIndex) {
		// sanitize the start index
		var totalNumRows = Math.ceil(items.length / getNumColumns());
		var maxStartIndex = (totalNumRows - getNumRows()) * getNumColumns();
		startIndex = Math.min(startIndex, maxStartIndex);
		startIndex = Math.max(startIndex, 0);
		
		// clear all li's
		coversUl.empty();
		
		// add new li's
		var n = getNumRows() * getNumColumns();
		if ((startIndex + n) >= items.length) {
			n = items.length - startIndex;
		}
		for (var i = startIndex; i < (startIndex + n); i++) {
			coversUl.append('<li data-item-index="' + i + '"><img src="' + getItem(i).coverImageUrl + '"/></li>');
		}
		
		// make the ul just wide enough to fit all columns
		coversUl.width(getNumColumns() * getCellSize().width);
		
		currentFirstItem = startIndex;
	};
	
	function selectItemAt(index) {
		if (index < 0) {
			index = 0;
		} else if (index >= items.length) {
			index = items.length - 1;
		}
		$('img.selected', coversUl).removeClass('selected');
		$('li[data-item-index="' + index + '"] img', coversUl).addClass('selected');
	};
	
	function getSelectedItemIndex() {
		return parseInt($('img.selected', coversUl).parent().data('item-index'), 10);
	};
	
	function getSelectedItemRowCol() {
		var pos = $('img.selected', coversUl).position();
		var cellSize = getCellSize();
		return {
			row: Math.floor(pos.top  / cellSize.height),
			col: Math.floor(pos.left / cellSize.width)
		};
	};
	
	function getItem(index) {
		return items[index];
	};
	
	function showMovieSheetFor(index) {
		jCinema.IKeyHandler.pushHandler(function (keyEvt) {
			var goBack = false;
			if (keyEvt.type === jCinema.IKeyHandler.KeyEvent.Enter ||
				keyEvt.type === jCinema.IKeyHandler.KeyEvent.Play ||
				keyEvt.type === jCinema.IKeyHandler.KeyEvent.PlayPause) {
				// enter and play button plays
				if (jCinema.IVideoControl.select(getItem(index).mediaUrl) &&
					jCinema.IVideoControl.play()) {
					jCinema.IKeyHandler.popHandler(); // get rid of this keyhandler
					jCinema.ViewStack.pushView('VideoView');
				}
			} else if (keyEvt.type === jCinema.IKeyHandler.KeyEvent.Back) {
				// back button aborts
				goBack = true;
			}
			
			if (goBack) {
				$('#movie-sheet img').attr('src', '');
				$('#movie-sheet').hide();
				jCinema.IKeyHandler.popHandler();
			}
			
			// don't let anyone else handle key events
			return false;
		});
		$('#movie-sheet').show();
		$('#movie-sheet img').attr('src', getItem(index).movieSheetImageUrl);
	};
	
	function onNavigate(dCols, dRows) {
		// must call getSelectedItemIndex() before we repopulate the grid
		var newIndex = getSelectedItemIndex() + dCols + (getNumColumns() * dRows);
		
		// move the page up or down if necessary
		var selRowCol = getSelectedItemRowCol();
		var firstRow = 0;
		var lastRow = (getNumRows() - 1);
		if (dRows < 0 && selRowCol.row + dRows < firstRow) {
			populateCoverGrid(currentFirstItem + (dRows * getNumColumns()));
		} else if (dRows > 0 && selRowCol.row + dRows > lastRow) {
			populateCoverGrid(currentFirstItem + (dRows * getNumColumns()));
		} else if (dCols < 0 && selRowCol.row == firstRow && selRowCol.col < -dCols) {
			populateCoverGrid(currentFirstItem - getNumColumns());
		} else if (dCols > 0 && selRowCol.row == lastRow && selRowCol.col + dCols >= getNumColumns()) {
			populateCoverGrid(currentFirstItem + getNumColumns());
		}
		
		selectItemAt(newIndex);
	};
	
	function onKey(keyEvt) {
		switch (keyEvt.type) {
			case jCinema.IKeyHandler.KeyEvent.Up:
				onNavigate( 0, -1);
				return false;
			case jCinema.IKeyHandler.KeyEvent.Down:
				onNavigate( 0, +1);
				return false;
			case jCinema.IKeyHandler.KeyEvent.Left:
				onNavigate(-1,  0);
				return false;
			case jCinema.IKeyHandler.KeyEvent.Right:
				onNavigate(+1,  0);
				return false;
			case jCinema.IKeyHandler.KeyEvent.Previous:
				onNavigate( 0, -getNumRows());
				return false;
			case jCinema.IKeyHandler.KeyEvent.Next:
				onNavigate( 0, +getNumRows());
				return false;
				
			case jCinema.IKeyHandler.KeyEvent.Enter:
				showMovieSheetFor(getSelectedItemIndex());
				return false;
				
			default:
				return true;
		}
	};
	
	// the main function called when the view becomes active
	var begin = function (data) {
		coversUl = $('#covers-area ul:first');
		
		// we want to get key events
		jCinema.IKeyHandler.pushHandler(onKey);
		
		// make sure we recalculate our layout on resize
		$(window).resize(function () {
			numColumns = numRows = undefined;
			
			// lift the constrain on width, or no resizing will happen
			coversUl.width('');
			
			var index = getSelectedItemIndex();
			populateCoverGrid(currentFirstItem);
			selectItemAt(index);
		});
		
		// get the available movies
		items = jCinema.IMediaDirectory.getMovieList();
		if (items == null) {
			items = [];
		}
		
		// initialize the view
		if (data === undefined) {
			populateCoverGrid(0);
			selectItemAt(0);
		} else {
			populateCoverGrid(data.startIndex);
			selectItemAt(data.selectedIndex);
		}
	};
	
	// the main function called when the view becomes inactive
	var end = function () {
		jCinema.IKeyHandler.popHandler();
		
		// return current selection and startIndex, so we
		// can restore it after video play
		return {
			startIndex:    currentFirstItem,
			selectedIndex: getSelectedItemIndex(),
		};
	};
	
	return {
		begin: begin,
		end: end
	};
	
}();