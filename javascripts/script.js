var ToDoList = {
  compileTemplates: function() {
    var tmp = this.templates;
    $("script[type='text/x-handlebars']").each(function() {
      var $tmpl = $(this);
      tmp[$tmpl.attr('id')] = Handlebars.compile($tmpl.html());
    });
    $('[data-type=partial]').each(function() {
      var $partial = $(this);
      Handlebars.registerPartial($partial.attr('id'), $partial.html());
    });
  },
  init: function() {
    this.templates = {};
    this.compileTemplates();
    this.currentView = 'all';
    this.list = this.loadList() || [];
    this.dateList = this.loadDates() || [];
    this.currentID = this.findLastID();
    this.completedDateList = this.createCompletedDateList();
    this.updateActiveDateList("");
    this.bind();
    return this;
  },
  bind: function() {
    $('#showModalForm').on('click', this.showModalForm.bind(this));
    $('#allTodosList').on('click', this.setViewToAll.bind(this));
    $('#allCompleteList').on('click', this.setViewToAllComplete.bind(this));
  },
  setViewToAll: function() {
    $('nav').find('[class="active"]').toggleClass('active');
    var date = 'all';
    this.updateActiveDateList(date);
    $('#allTodosList').toggleClass('active');
    this.currentView = 'all';
    this.displayList();
  },
  setViewToAllComplete: function() {
    $('nav').find('[class="active"]').toggleClass('active');
    var date = 'allComplete';
    this.updateActiveDateList(date);
    $('#allCompleteList').toggleClass('active');
    this.currentView = 'allComplete';
    this.displayList();
  },
  setViewToDate: function(date) {
    $('nav').find('[class="active"]').toggleClass('active');
    this.updateActiveDateList(date);
    this.currentView = date;
    this.displayList();
  },
  setViewToCompleteDate: function(date) {
    $('nav').find('[class="active"]').toggleClass('active');
    this.currentView = date + 'C';
    this.updateActiveDateList(this.currentView);
    this.displayList();
  },
  showModalForm: function(e) {
    e.preventDefault();
    $('main').append(this.templates.modalLayerTemplate({}));
    $('main').append(this.templates.modalFormTemplate({}));
    $('#modalLayer').fadeIn(300);
    $('#modalForm').fadeIn(300);
  },
  showUpdateForm: function(id) {
    var currentTodo = this.getSingleItem(id);
    $('main').append(this.templates.modalLayerTemplate({}));
    $('main').append(this.templates.modalFormTemplate(currentTodo));
    $('#modalLayer').fadeIn(300);
    $('#modalForm').fadeIn(300);
  },
  updateActiveDateList: function(date) {
    this.dateList.forEach(function(singleDate) {
      if (singleDate.date === date) {
        singleDate.status = 'active';
      } else {
        singleDate.status = 'inactive';
      }
    });
    this.completedDateList.forEach(function(singleDate) {
      if (singleDate.date + 'C' === date) {
        singleDate.status = 'active';
      } else {
        singleDate.status = 'inactive';
      }
    });
  },
  getSingleItem: function(id) {
    id = parseInt(id, 10);
    var result = this.list.filter(function(object) {
      return object.id === id;
    });
    return result[0];
  },
  removeModalForm: function() {
    $('#modalForm').fadeOut(300, function() { $(this).remove();});
    $('#modalLayer').fadeOut(300, function() { $(this).remove();});
  },
  loadList: function() {
    return JSON.parse(localStorage.getItem('list'));
  },
  loadDates: function() {
    return JSON.parse(localStorage.getItem('dates'));
  },
  findLastID: function() {
    if (this.list.length === 0) {
      return 0;
    } else {
      var finalItem = this.list[this.list.length - 1];
      return finalItem.id + 1;
    }
  },
  addNewTodo: function(data) {
    var newTodo = {};
    data.forEach(function(object) {
      newTodo[object.name] = object["value"];
    });
    newTodo.id = this.currentID;
    newTodo.dueDate = this.dueDate(newTodo.month, newTodo.year);
    newTodo.complete = false;
    this.currentID += 1;
    this.list.push(newTodo);
    this.addToDateList(newTodo.dueDate);
  },
  addToDateList: function(date) {
    var found = false;
    this.dateList.forEach(function(singleEntry) {
      if (singleEntry.date === date) {
        found = true;
        singleEntry.total += 1;
      }
    });
    if (!found) {
      var newEntry = {
        date: date,
        total: 1,
      };
      this.dateList.push(newEntry);
      this.sortDateList();
    }
  },
  sortDateList: function() {
    this.dateList.sort(function(a,b) {
      return dateSum(a) - dateSum(b);
    });
  },
  updateDateList: function(date) {
    var self = this;
    this.dateList.forEach(function(currentItem, index) {
      if (currentItem.date === date) {
        currentItem.total -= 1;
      }
      if (currentItem.total <= 0) {
        self.dateList.splice(index, 1);
      }
    });
  },
  getListByView: function() {
    var tmp;
    if (this.currentView === 'all') {
      return this.sortSingleList(this.list);
    } else if (this.currentView == 'allComplete') {
      return this.allCompletedItems();
    } else if (this.currentView.indexOf('C') !== -1) {
      tmp = this.filterListByDate();
      tmp = this.filterListByComplete(tmp);
      return tmp;
    } else {
      tmp = this.filterListByDate();
      tmp = this.sortSingleList(tmp);
      return tmp;
    }
  },
  getHeaderTextByView: function() {
    if (this.currentView === 'all') {
      return 'All Todos';
    } else if (this.currentView == 'allComplete') {
      return 'Completed';
    } else if (this.currentView.indexOf('C') !== -1) {
      return this.currentView.slice(0, -1);
    } else {
      return this.currentView;
    }
  },
  displayList: function() {
    var sortedList = this.getListByView();
    var headerText = this.getHeaderTextByView();
    $('section.nav-all span.remaining').text(String(this.list.length));
    $('section.nav-complete span.remaining').text(String(this.allCompletedItems().length));
    $('#completeTodosByDate').html(this.templates.navListItems({lists: this.completedDateList}));
    $('section.header h2').text(headerText);
    $('#todosByDate').html(this.templates.navListItems({lists: this.dateList}));
    $('#listTable').html(this.templates.todoListItems({todos: sortedList}));
    $('#selectedTotal').text(String(sortedList.length));
  },
  sortSingleList: function(currentList) {
    var uncompleteList = [];
    var completeList = [];
    currentList.forEach(function(currentTodo) {
      if (currentTodo.complete) {
        completeList.push(currentTodo);
      } else {
        uncompleteList.push(currentTodo);
      }
    });
    return uncompleteList.concat(completeList);
  },
  filterListByComplete: function(currentList) {
    var result = currentList.filter(function(currentTodo) {
      return currentTodo.complete === true;
    });
    return result;
  },
  createCompletedDateList: function() {
    var result = [];
    var self = this;
    var currentList;
    this.dateList.forEach(function(singleDate) {
      currentList = self.list.filter(function(object) {
        return object.dueDate === singleDate.date;
      });
      var total = currentList.filter(function(singleTodo) {
        return singleTodo.complete === true;
      }).length;
      
      if (total >= 1) {
        result.push({date: singleDate.date, total: total});
      }

    });
    return result;
  },
  filterListByDate: function() {
    var currentView = this.currentView;
    if (currentView[currentView.length - 1] === 'C') {
      currentView = currentView.slice(0, -1);
    }
    var result = this.list.filter(function(currentTodo) {
      return currentTodo.dueDate === currentView;
    });
    return result;
  },
  allCompletedItems: function() {
    var result = this.list.filter(function(singleItem) {
      return singleItem.complete === true;
    });
    return result;
  },
  dueDate: function(month, year) {
    if (month === "Month" || year === "Year") {
      return "No Due Date";
    }
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var monthNumber = months.indexOf(month) + 1;
    if (monthNumber < 10) {
      monthNumber = String('0' + monthNumber);
    }
    var yearNumber = year.slice(2);
    return String(monthNumber + '/' + yearNumber);
  },
  allTodoListItems: function() {
    return this.list;
  },
  allDates: function() {
    return this.dateList;
  },
  destroy: function(id) {
    id = parseInt(id, 10);
    var singleItem = this.getSingleItem(id);
    var date = singleItem.dueDate;
    this.updateDateList(date);
    this.list = this.list.filter(function(object) {
      return object.id !== id;
    });
    this.completedDateList = this.createCompletedDateList();
  },
  updateTodoInfo: function(data, id) {
    var selectedTodo = this.getSingleItem(id);
    var previousDate = selectedTodo.dueDate;
    data.forEach(function(object) {
      selectedTodo[object.name] = object["value"];
    });
    selectedTodo.dueDate = this.dueDate(selectedTodo.month, selectedTodo.year);
    this.updateDateList(previousDate);
    this.addToDateList(selectedTodo.dueDate);
    this.completedDateList = this.createCompletedDateList();
  },
  markAsComplete: function(id) {
    var singleItem = this.getSingleItem(id);
    if (singleItem === undefined) {
      alert("You can't mark as complete an item you haven't made yet!");
      return false;
    }
    singleItem.complete = true;
    this.completedDateList = this.createCompletedDateList();
    return true;
  },
  toggle: function(id) {
    var singleItem = this.getSingleItem(id);
    if (singleItem.complete) {
      singleItem.complete = false;
    } else {
      this.markAsComplete(id);
    }
    this.completedDateList = this.createCompletedDateList();
  }
};

function dateSum(object) {
  if (object.date === "No Due Date") {
    return 0;
  }
  var monthString = object.date.slice(0, 2);
  var yearString = object.date.slice(3);
  var result = parseInt(monthString, 10) + (parseInt(yearString, 10) * 12);
  return result;
}

$(function() {
  var todo = Object.create(ToDoList).init();
  todo.displayList();

  $('main').on('click', '#modalLayer', function(e) {
    todo.removeModalForm();
  });

  $('main').on('click', '#submitNewTodo', function(e) {
    e.preventDefault();
    var $form = $(this).closest('form');
    var data = $form.serializeArray();
    if ($('#modalForm').attr('data-id') === "") {
      todo.addNewTodo(data);
      todo.setViewToAll();
    } else {
      var id = $('#modalForm').attr('data-id');
      var currentTodo = todo.getSingleItem(id);
      var date = currentTodo.dueDate;
      todo.updateTodoInfo(data, id);
      if (todo.currentView !== 'all' && todo.currentView !== 'allComplete') {
        todo.updateActiveDateList(todo.currentView);
      } 
    }
    todo.removeModalForm();
    todo.displayList();
  });

  $('main').on('click', '#markAsComplete', function(e) {
    e.preventDefault();
    var id = $(this).closest('form').attr('data-id');
    if (todo.markAsComplete(id)) {
      todo.removeModalForm();
      todo.displayList();
    }
  });

  $('main').on('click', '#toggleListItem', function(e) {
    if ($(this).attr('id') === 'updateTodo') {
      return;
    }
    var id = $(this).find('a').attr('data-id');
    todo.toggle(id);
    todo.displayList();
  });

  $('main').on('click', '#destroyTodo', function(e) {
    e.preventDefault();
    var id = $(this).closest('td').attr('data-id');
    todo.destroy(id);
    todo.displayList();
  })

  $('main').on('click', '#updateTodo', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var id = $(this).attr('data-id');
    todo.showUpdateForm(id);
  })

  $('#todosByDate').on('click', 'tr', function(e) {
    e.preventDefault();
    var date = $(this).closest('tr').attr('data-date');
    todo.setViewToDate(date);
  });

  $('#completeTodosByDate').on('click', 'tr', function(e) {
    e.preventDefault();
    var date = $(this).closest('tr').attr('data-date');
    todo.setViewToCompleteDate(date);
  });

  $(window).on('unload', function() {
    var list = todo.allTodoListItems();
    var dates = todo.allDates();
    localStorage.setItem('list', JSON.stringify(list));
    localStorage.setItem('dates', JSON.stringify(dates));
  });
})
