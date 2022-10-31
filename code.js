let board;

const DIRECTIONS = {
  'top': [-1, 0],
  'bottom': [1, 0],
  'left': [0, -1],
  'right': [0, 1],
};

class Board {
  #field = [
    [0, 0, 0, 0, 2, 0],
    [0, 0, 0, 0, 2, 0],
    [0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 4],
    [0, 3, 3, 3, 0, 4],
    [0, 0, 0, 0, 0, 0],
  ];
  
  constructor() {
    this.draw();
  }
  
  draw() {
    document.getElementById("board_container").innerHTML = this.html;
  }
  
  get html() {
    return `<table>${this.#field.map((row, row_index) => this.#row_to_html(row_index)).join('')}</table>`;
  }
  
  #row_to_html(row) {
    return `<tr ${this.#field[row].includes(1) ? 'class="end_row"' : ''}>${this.#field[row].map((id, col) => this.#cell_to_html(row, col)).join('')}</tr>`;
  }
  
  #cell_to_html(row, col) {
    return `<td class="${this.#get_cell_classes(row, col)}" data-id="${this.#field[row][col]}" onclick="board.on_click(this)"></td>`;
  }
  
  #get_cell_classes(row, col) {
    if (this.#field[row][col] === 0)
      return '';
    else if (this.#cells_equal(row, col, row, col-1) && this.#cells_equal(row, col, row, col+1))
      return 'hor mid';
    else if (this.#cells_equal(row, col, row, col-1))
      return 'hor right';
    else if (this.#cells_equal(row, col, row, col+1))
      return 'hor left';
    else if (this.#cells_equal(row, col, row-1, col) && this.#cells_equal(row, col, row+1, col))
      return 'ver mid';
    else if (this.#cells_equal(row, col, row-1, col))
      return 'ver bottom';
    else if (this.#cells_equal(row, col, row+1, col))
      return 'ver top';
    
    return '';
  }
  
  #cells_equal(row1, col1, row2, col2) {
    if (!this.#is_in_field(row1, col1) || !this.#is_in_field(row2, col2))
      return false;
    
    return this.#field[row1][col1] === this.#field[row2][col2];
  }
  
  #is_in_field(row, col) {
    return row >= 0 && row < this.#field.length
        && col >= 0 && col < this.#field[row].length;
  }
  
  #is_winning_move(row, col, dir) {
    return dir === 'right'
      && this.#field[row][col] === 1
      && this.#field[row].length === col+1;
  }
  
  #is_valid_move(row, col, move) {
    return this.#is_in_field(row + move[0], col + move[1]) && this.#field[row + move[0]][col + move[1]] === 0;
  }
  
  #move(row, col, move) {
    this.#field[row + move[0]][col + move[1]] = this.#field[row][col];
    this.#field[row][col] = 0;
    if(this.#cells_equal(row + move[0], col + move[1], row - move[0], col - move[1]))
      this.#move(row - move[0], col - move[1], move);
  }
  
  on_click(cell) {
    let row = cell.parentNode.rowIndex;
    let col = cell.cellIndex;
    let dir = cell.classList.item(1);
    if(!(dir in DIRECTIONS)) return;
    let move = DIRECTIONS[dir];
    
    if (this.#is_winning_move(row, col, dir)) {
      alert("WIN");
      return;
    }
    
    if (!this.#is_valid_move(row, col, move)) return;
    
    this.#move(row, col, move);
    this.draw();
  }
}

window.onload = async () => {
  board = new Board();
}