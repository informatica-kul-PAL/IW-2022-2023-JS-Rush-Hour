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
  
  last_move_id = '0';
  move_count = 0;
  
  moving = '0';
  moving_orient = '';
  x_base = 0;
  y_base = 0;
  x_move = 0;
  y_move = 0;
  bounds;
  cellsize;
  
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
      cell.addEventListener('touchstart', (event) => this.on_drag_start(cell, event.touches[0]));
      cell.addEventListener('mousedown', (event) => this.on_drag_start(cell, event));
      document.body.addEventListener('touchmove', (event) => this.on_drag(event.touches[0]));
      document.body.addEventListener('mousemove', (event) => this.on_drag(event));
      document.body.addEventListener('touchend', (event) => this.on_drag_end());
      document.body.addEventListener('mouseup', (event) => this.on_drag_end());
    });
    this.cellsize = document.getElementsByTagName('td')[0].offsetWidth;
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
  
  calc_bounds(id, orient) {
    let bounds = {
      actual: {
        min: 0,
        max: 0,
      },
      limit: {
        min: 0,
        max: 0,
      }
    }
    switch(orient) {
      case 'hor':
        let left_most = [...document.getElementsByClassName('hor left')].find(td => td.dataset.id === id);
        let right_most = [...document.getElementsByClassName('hor right')].find(td => td.dataset.id === id);
        bounds.limit = {
          min: -1 * this.count_empty(left_most, DIRECTIONS.left),
          max: this.count_empty(right_most, DIRECTIONS.right),
        };
        bounds.actual.max = bounds.limit.max + ((id === '1' && this.no_right_bound(right_most)) ? 1 : 0);
        break;
      case 'ver':
        let top_most = [...document.getElementsByClassName('ver top')].find(td => td.dataset.id === id);
        let bottom_most = [...document.getElementsByClassName('ver bottom')].find(td => td.dataset.id === id);
        bounds.limit = {
          min: -1 * this.count_empty(top_most, DIRECTIONS.top),
          max: this.count_empty(bottom_most, DIRECTIONS.bottom),
        };
        bounds.actual.max = bounds.limit.max;
    }
    bounds.actual.min = bounds.limit.min;
    return bounds;
  }
  
  scaled_bounds(id, orient) {
    let bounds = this.calc_bounds(id, orient);
    let scale = this.cellsize * 1.1;
    bounds.actual.min *= scale;
    bounds.actual.max *= scale;
    bounds.limit.min *= scale;
    bounds.limit.max *= scale;
    return bounds;
  }
  
  no_right_bound(cell) {
    let row = cell.parentNode.rowIndex;
    let col = cell.cellIndex;
    let dir = DIRECTIONS.right;
    for (let i = 1; this.is_in_field(row + dir[0] * i, col + dir[1] * i); i++)
      if (this.field[row + dir[0] * i][col + dir[1] * i] !== 0)
        return false;
    return true;
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
  
  on_drag_start(cell, event) {
    if (document.body.classList.contains('win'))
      return;
    
    let id = cell.dataset.id;
    if (!id) return;
    
    this.moving = id;
    this.moving_orient = cell.classList[0];
    
    this.x_base = event.clientX;
    this.y_base = event.clientY;
    
    this.bounds = this.scaled_bounds(this.moving, this.moving_orient);
  }
  
  on_drag_end() {
    if (document.body.classList.contains('win') || this.moving === '0')
      return;
    
    let move_x = this.calc_bounded_move(this.x_move - this.x_base, this.bounds.actual);
    let move_y = this.calc_bounded_move(this.y_move - this.y_base, this.bounds.actual);
    
    let leading_classes
    let move;
    let dist;
    
    switch (this.moving_orient) {
      case 'hor':
        leading_classes = move_x > 0 ? 'hor right' : 'hor left';
        move = move_x > 0 ? DIRECTIONS.right : DIRECTIONS.left;
        dist = move_x;
        break;
      case 'ver':
        leading_classes = move_y > 0 ? 'ver bottom' : 'ver top';
        move = move_y > 0 ? DIRECTIONS.bottom : DIRECTIONS.top;
        dist = move_y;
        break;
    }
    
    let leading_cell = [...document.getElementsByClassName(leading_classes)].find(td => td.dataset.id === this.moving);
    if (!leading_cell) {
      console.log("huh");
      this.moving = '0';
      this.draw();
      return;
    }
    dist = Math.abs(Math.round(dist / (leading_cell.offsetWidth * 1.1)));
    let row = leading_cell.parentNode.rowIndex;
    let col = leading_cell.cellIndex;
    
    let limited_move_x = this.calc_bounded_move(this.x_move - this.x_base, this.bounds.limit);
    if (limited_move_x < move_x) {
      dist--;
    }
    
    for (let i = 0; i < dist; i++) {
      this.move(row + i * move[0], col + i * move[1], move);
    }
    
    if (dist !== 0 && this.last_move_id !== this.moving) {
      this.move_count++;
      this.last_move_id = this.moving;
    }
  
    this.moving = '0';
    this.draw();
    timer.start();
    if (limited_move_x < move_x) {
      this.on_win();
    }
  }
  
  on_drag(event) {
    if (document.body.classList.contains('win') || this.moving === '0')
      return;
    
    this.x_move = event.clientX;
    this.y_move = event.clientY;
    
    [...document.getElementsByTagName('td')]
      .filter(td =>td.dataset.id === this.moving)
      .forEach(cell => {
        switch (cell.classList.item(0)) {
          case 'ver':
            cell.setAttribute("style", `--move-y: ${this.calc_bounded_move(event.clientY - this.y_base, this.bounds.actual)}px;`);
            break;
          case 'hor':
            cell.setAttribute("style", `--move-x: ${this.calc_bounded_move(event.clientX - this.x_base, this.bounds.actual)}px;`);
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
