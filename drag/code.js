let board;
let timer;

const DIRECTIONS = {
  'top': [-1, 0],
  'bottom': [1, 0],
  'left': [0, -1],
  'right': [0, 1],
};

const LEVELS = {
  'intermediate': [
    [ 3,  3,  7,  9,  0,  0],
    [ 2,  2,  7,  9,  0,  0],
    [ 8,  1,  1,  9,  0,  0],
    [ 8,  4,  4,  4,  0,  0],
    [ 8,  5,  5,  0,  0,  0],
    [ 6,  6,  6,  0,  0,  0],
  ],
  'advanced': [
    [ 0,  4,  0,  7,  7,  7],
    [ 2,  4,  0,  8, 10,  0],
    [ 2,  1,  1,  8, 10, 11],
    [ 3,  5,  5,  5, 10, 11],
    [ 3,  0,  6,  0,  0, 12],
    [ 0,  0,  6,  9,  9, 12],
  ],
  'expert': [
    [ 2,  0,  0,  6,  6,  6],
    [ 2,  3,  3,  7,  0,  0],
    [ 1,  1,  4,  7,  0, 11],
    [ 0,  0,  4,  8,  8, 11],
    [ 0,  0,  5,  9,  9, 11],
    [ 0,  0,  5, 10, 10, 10],
  ],
  'grand_master': [
    [ 2,  2,  6,  0,  9,  9],
    [ 3,  3,  6,  0, 10,  0],
    [ 4,  0,  1,  1, 10,  0],
    [ 4,  7,  7,  7, 10, 11],
    [ 4,  0,  0,  8,  0, 11],
    [ 5,  5,  0,  8, 12, 12],
  ],
};

class Board {
  level_name;
  field;
  
  last_move_id = 0;
  last_move_dir = '';
  move_count = 0;
  
  moving = 0;
  x_base = 0;
  y_base = 0;
  
  constructor(level_name) {
    this.level_name = level_name;
    this.field = JSON.parse(JSON.stringify(LEVELS[level_name]));
    timer.reset();
    document.body.classList.remove('win');
    this.draw();
  }
  
  draw() {
    document.getElementById('move_count').innerHTML = `${this.move_count} Moves`;
    document.getElementById('board_container').innerHTML = this.html;
    [...document.getElementsByTagName('td')].forEach(cell => {
      cell.addEventListener('touchstart', (event) => this.on_drag_start_touch(cell, event));
      cell.addEventListener('mousedown', (event) => this.on_drag_start(cell, event));
      cell.addEventListener('touchmove', (event) => this.on_drag_touch(cell, event));
      cell.addEventListener('mousemove', (event) => this.on_drag(cell, event));
      cell.addEventListener('touchend', (event) => this.on_drag_end(cell));
      cell.addEventListener('mouseup', (event) => this.on_drag_end(cell));
    })
  }
  
  get html() {
    return `<table>${this.field.map((row, row_index) => this.row_to_html(row_index)).join('')}</table>`;
  }
  
  row_to_html(row) {
    return `<tr ${this.field[row].includes(1) ? 'class="end_row"' : ''}>${this.field[row].map((id, col) => this.cell_to_html(row, col)).join('')}</tr>`;
  }
  
  cell_to_html(row, col) {
    return `<td class="${this.get_animated_cell_classes(row, col)}" data-id="${this.field[row][col]}"></td>`;
  }
  
  get_cell_classes(row, col) {
    if (this.field[row][col] === 0)
      return '';
    else if (this.cells_equal(row, col, row, col-1) && this.cells_equal(row, col, row, col+1))
      return 'hor mid';
    else if (this.cells_equal(row, col, row, col-1))
      return 'hor right';
    else if (this.cells_equal(row, col, row, col+1))
      return 'hor left';
    else if (this.cells_equal(row, col, row-1, col) && this.cells_equal(row, col, row+1, col))
      return 'ver mid';
    else if (this.cells_equal(row, col, row-1, col))
      return 'ver bottom';
    else if (this.cells_equal(row, col, row+1, col))
      return 'ver top';
    
    return '';
  }
  
  get_animated_cell_classes(row, col) {
    return `${this.get_cell_classes(row, col)}${this.field[row][col] === this.last_move_id ? ` move_${this.last_move_dir}` : ''}`;
  }
  
  cells_equal(row1, col1, row2, col2) {
    if (!this.is_in_field(row1, col1) || !this.is_in_field(row2, col2))
      return false;
    
    return this.field[row1][col1] === this.field[row2][col2];
  }
  
  is_in_field(row, col) {
    return row >= 0 && row < this.field.length
        && col >= 0 && col < this.field[row].length;
  }
  
  is_winning_move(row, col, dir) {
    return dir === 'right'
      && this.field[row][col] === 1
      && this.field[row].length === col+1;
  }
  
  is_valid_move(row, col, move) {
    return this.is_in_field(row + move[0], col + move[1]) && this.field[row + move[0]][col + move[1]] === 0;
  }
  
  move(row, col, move) {
    this.field[row + move[0]][col + move[1]] = this.field[row][col];
    this.field[row][col] = 0;
    if(this.cells_equal(row + move[0], col + move[1], row - move[0], col - move[1]))
      this.move(row - move[0], col - move[1], move);
  }
  
  on_win() {
    timer.stop();
    document.body.classList.add('win');
    document.getElementById('win_move_count').innerHTML = `${this.move_count} Moves`;
    document.getElementById('win_timer').innerHTML = timer.formatted;
  }
  
  on_click(cell) {
    if (document.body.classList.contains('win'))
      return;
    
    let row = cell.parentNode.rowIndex;
    let col = cell.cellIndex;
    let dir = cell.classList.item(1);
    if(!(dir in DIRECTIONS)) return;
    let move = DIRECTIONS[dir];
    
    if (this.is_winning_move(row, col, dir)) {
      this.on_win();
      return;
    }
    
    if (!this.is_valid_move(row, col, move)) return;
    
    if (this.last_move_id !== this.field[row][col])
      this.move_count++;
    
    this.last_move_id = this.field[row][col];
    this.move(row, col, move);
    timer.start();
    this.last_move_dir = dir;
    
    this.draw();
  }
  
  on_drag_start(cell, event) {
    if (document.body.classList.contains('win'))
      return;
    
    let id = cell.dataset.id;
    if (!id) return;
    
    this.moving = id;
    
    this.x_base = event.clientX;
    this.y_base = event.clientY;
  }
  
  calc_offset_bounds(cell, orient) {
    switch(orient) {
      case 'hor':
        let left_most = [...document.getElementsByClassName('hor left')].find(td => td.dataset.id === cell.dataset.id);
        let right_most = [...document.getElementsByClassName('hor right')].find(td => td.dataset.id === cell.dataset.id);
        return {
          min: this.count_empty(left_most, DIRECTIONS.left),
          max: this.count_empty(right_most, DIRECTIONS.right),
        };
      case 'ver':
        let top_most = [...document.getElementsByClassName('ver top')].find(td => td.dataset.id === cell.dataset.id);
        let bottom_most = [...document.getElementsByClassName('ver bottom')].find(td => td.dataset.id === cell.dataset.id);
        return {
          min: this.count_empty(top_most, DIRECTIONS.top),
          max: this.count_empty(bottom_most, DIRECTIONS.bottom),
        };
    }
    return {
      min: 0,
      max: 0,
    };
  }
  
  scaled_offset_bounds(cell, orient) {
    let bounds = this.calc_offset_bounds(cell, orient);
    return {
      min: bounds.min * cell.offsetWidth * 1.1,
      max: bounds.max * cell.offsetWidth * 1.1
    }
  }
  
  count_empty(from_cell, dir) {
    let row = from_cell.parentNode.rowIndex;
    let col = from_cell.cellIndex;
    let i;
    for (i = 1;
         this.is_in_field(row + dir[0] * i, col + dir[1] * i)
            && this.field[row + dir[0] * i][col + dir[1] * i] === 0;
         i++);
    return --i;
  }
  
  on_drag_end(cell) {
    this.moving = 0;
    this.x_base = 0;
    this.y_base = 0;
    
    this.draw();
  }
  
  on_drag(cell, event) {
    if (document.body.classList.contains('win') || this.moving === 0)
      return;
    
    let bounds = this.scaled_offset_bounds(cell, cell.classList.item(0));
    
    [...document.getElementsByTagName('td')]
      .filter(td =>td.dataset.id === this.moving)
      .forEach(cell => {
        switch (cell.classList.item(0)) {
          case 'ver':
            cell.setAttribute("style", `--move-y: ${this.calc_bounded_move(event.clientY - this.y_base, bounds)}px;`);
            break;
          case 'hor':
            cell.setAttribute("style", `--move-x: ${this.calc_bounded_move(event.clientX - this.x_base, bounds)}px;`);
            break;
        }
      });
  }
  
  calc_bounded_move(dif, bounds) {
    if (dif < bounds.min)
      return bounds.min;
    if (dif > bounds.max)
      return bounds.max;
    return dif;
  }
  
  on_drag_start_touch(cell, event) {
    this.on_drag_start(cell, event.touches[0]);
  }
  
  on_drag_touch(cell, event) {
    this.on_drag(cell, event.touches[0]);
  }
}

class Timer {
  seconds_passed = 0;
  interval;
  
  constructor() {
    this.draw();
  }
  
  draw() {
    document.getElementById('timer').innerHTML = this.formatted;
  }
  
  get formatted() {
    let seconds = this.seconds_passed % 60;
    let minutes = Math.floor(this.seconds_passed / 60) % 60;
    let hours = Math.floor(this.seconds_passed / 3600);
    
    return `${hours !== 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  increment() {
    this.seconds_passed++;
    this.draw();
  }
  
  start() {
    if (!this.interval)
      this.interval = setInterval(this.increment.bind(this), 1000);
  }
  
  stop() {
    clearInterval(this.interval);
    this.interval = undefined;
  }
  
  reset() {
    this.stop();
    this.seconds_passed = 0;
    this.draw();
  }
}

function select_level(level_name) {
  if (level_name in LEVELS && level_name !== board.level_name)
    board = new Board(level_name);
}

function reset_game() {
  let level_selector = document.getElementById('level_select')
  board = new Board(level_selector.value)
}

window.onload = async () => {
  timer = new Timer();
  board = new Board("intermediate");
}
