interface Task {
    id: string;
    title: string;
    description: string;
    createDate: Date;
    status: Status;
    type: TaskType;
    deadline?: string;
    assignee?: string;
    location?: LocationTask;
}

enum LocationTask {
    MOSCOW= 'Москва',
    TVER= 'Тверь',
    EKATERINBURG = 'Екатеринбург'
}

enum Status {
    OPEN = 'Не выполнено',
    DONE = 'Выполнено',
    ALL = 'Все'
}

enum TaskType {
    OFFICE = 'Задача в офисе',
    DEADLINE = 'Задача с дедлайном',
    ASSIGNEE = 'Задача с ответственным лицом',
    ALL = 'Все'
}

// Определяем интерфейс для сотрудника
interface Employee {
    id: number;
    name: string;
    position: string;
}

// Создаем массив сотрудников
const employees: Employee[] = [
    { id: 1, name: "Иван Иванов", position: "Менеджер" },
    { id: 2, name: "Андрей Андреев", position: "Разработчик" },
    { id: 3, name: "Олег Олегов", position: "Дизайнер" }
];

const taskTypes: TaskType[] = [TaskType.OFFICE, TaskType.DEADLINE, TaskType.ASSIGNEE];
const statuses: Status[] = [Status.OPEN, Status.DONE];
const locations: LocationTask[] = [LocationTask.MOSCOW, LocationTask.TVER, LocationTask.EKATERINBURG];

interface IModal {
    closeModal: () => void;
    openModal: () => void;
}


class TaskManager {
    private readonly createTaskButton: HTMLButtonElement;
    private readonly saveTaskButton: HTMLButtonElement;
    private readonly titleInput: HTMLInputElement;
    private readonly descriptionInput: HTMLInputElement;
    private readonly taskDeadlineInput: HTMLInputElement;
    private readonly taskTypeSelect: HTMLSelectElement;
    private readonly taskStatusSelect: HTMLSelectElement;
    private readonly taskAssigneeSelect: HTMLSelectElement;
    private readonly taskLocationSelect: HTMLSelectElement;
    private readonly filterStatusSelect: HTMLSelectElement;
    private readonly filterTypeSelect: HTMLSelectElement;
    private readonly taskList: HTMLElement;
    private applyFiltersButton: HTMLButtonElement;
    private isTaskListOpen: boolean;
    private currentId: string | null;
    private tasks: Task[] = [];
    private modal: Modal;

    constructor() {
        this.createTaskButton = document.getElementById('createTaskButton') as HTMLButtonElement;
        this.saveTaskButton = document.getElementById('saveTask') as HTMLButtonElement;
        this.titleInput = document.getElementById('titleInput') as HTMLInputElement;
        this.descriptionInput = document.getElementById('descriptionInput') as HTMLInputElement;
        this.taskDeadlineInput = document.getElementById('taskDeadline') as HTMLInputElement;
        this.taskTypeSelect = document.getElementById('taskType') as HTMLSelectElement;
        this.taskStatusSelect = document.getElementById('taskStatus') as HTMLSelectElement;
        this.taskAssigneeSelect = document.getElementById('taskAssignee') as HTMLSelectElement;
        this.taskLocationSelect = document.getElementById('taskLocation') as HTMLSelectElement;
        this.filterStatusSelect = document.getElementById('filterStatus') as HTMLSelectElement;
        this.filterTypeSelect = document.getElementById('filterType') as HTMLSelectElement;
        this.applyFiltersButton = document.getElementById('applyFilters') as HTMLButtonElement;
        this.taskList = document.getElementById('tasksList') as HTMLElement;

        this.modal = new Modal();
        this.currentId = null;
        this.isTaskListOpen = false;

        this._openModal = this._openModal.bind(this);
        this._createTask = this._createTask.bind(this);
        this._changeVisibleFields = this._changeVisibleFields.bind(this);
        this._addTask = this._addTask.bind(this);

        this._loadTasks();
        this._attachListeners();
        this._renderSelects();
    }

    private _renderSelects() {
        this._renderSelect(this.taskTypeSelect, taskTypes);
        this._renderSelect(this.taskStatusSelect, statuses);
        this._renderSelect(this.taskAssigneeSelect, ['Не назначен', ...employees.map(employ => employ.name)]);
        this._renderSelect(this.taskLocationSelect, locations);
        this._renderSelect(this.filterTypeSelect, ['Все', ...taskTypes]);
        this._renderSelect(this.filterStatusSelect, ['Все', ...statuses]);
    }

    private _applyFilters() {
        const selectedStatus = this.filterStatusSelect.value as Status;
        const selectedType = this.filterTypeSelect.value as TaskType;

        // Убедимся, что мы передаем правильные значения для фильтрации
        const filteredTasks = this.filterTasks(selectedStatus, selectedType);

        this._renderTaskList(filteredTasks);
    }

    private filterTasks(status?: string, type?: string): Task[] {
        return this.tasks.filter((task) => {
            const statusMatch = !status || status === 'Все' || task.status === status;
            const typeMatch = !type || type === 'Все' || task.type === type;
            return statusMatch && typeMatch;
        });
    }

    private _resetContent() {
        this.titleInput.value = '';
        this.descriptionInput.value = '';
        this.taskDeadlineInput.value = '';
        this.taskTypeSelect.value = TaskType.OFFICE;
        this.taskStatusSelect.value = Status.OPEN;
        this.taskLocationSelect.value = LocationTask.MOSCOW;
        this.taskAssigneeSelect.value = 'Не назначен';
        this.currentId = null;
    }


    private _changeVisibleFields() {
        switch (this.taskTypeSelect.value) {
            case TaskType.DEADLINE:
                this.taskAssigneeSelect?.parentElement?.classList.add('hide');
                this.taskDeadlineInput?.parentElement?.classList.remove('hide');
                this.taskLocationSelect?.parentElement?.classList.add('hide');
                break;
            case TaskType.ASSIGNEE:
                this.taskAssigneeSelect?.parentElement?.classList.remove('hide');
                this.taskDeadlineInput?.parentElement?.classList.add('hide');
                this.taskLocationSelect?.parentElement?.classList.add('hide');
                break;
            default:
                this.taskAssigneeSelect?.parentElement?.classList.add('hide');
                this.taskDeadlineInput?.parentElement?.classList.add('hide');
                this.taskLocationSelect?.parentElement?.classList.remove('hide');
                break;
        }
    }

    private _attachListeners() {
        this.createTaskButton?.addEventListener('click', this._createTask);
        this.saveTaskButton.addEventListener('click', this._addTask);
        this.taskTypeSelect.addEventListener('change', this._changeVisibleFields);
        this.applyFiltersButton.addEventListener('click', this._applyFilters.bind(this));
        this.taskList.addEventListener('click', (event) => {
            const parentElement = (event.target as HTMLElement).parentElement;
            const removeButton = document.querySelectorAll('.remove-button') as NodeListOf<HTMLElement>;
            this.isTaskListOpen = true;
            if (parentElement?.classList.contains('wrapper')) {
                this._showCurrentTask(parentElement.parentElement!.dataset.id!);
            }

            removeButton.forEach((button: HTMLElement) => {
                if (button.dataset.id === (event.target as HTMLElement).dataset.id)  {
                    this._removeTask((event.target as HTMLElement).dataset.id!);
                }
            })
        });
    }

    private _renderSelect(select: HTMLSelectElement, options: string[]) {
        options.forEach((item) => {
            const option = document.createElement('option');
            option.text = item;
            option.value = item;
            select.append(option);
        })
    }

    private _renderTaskList(tasks?: Task[]) {
        this.taskList.textContent = '';

        if (!tasks && !this.tasks || this.tasks.length === 0) {
            this.taskList.textContent = 'Список задач пуст';
        } else if (tasks && tasks.length === 0) {
            this.taskList.textContent = 'Нет совпадений. Попробуйте по другому';
        }

        const arrayTasks = tasks ?? this.tasks;
        arrayTasks.forEach((task) => {
            const li = document.createElement('li');
            li.dataset.id = task.id;

            const spanTitle = document.createElement('span');
            const spanTaskType = document.createElement('span');
            const spanTaskStatus = document.createElement('span');
            const spanWrapper = document.createElement('span');
            const button = document.createElement('button');

            spanTitle.textContent = task.title;
            spanTaskType.textContent = task.type;
            spanTaskStatus.textContent = task.status;
            button.textContent = 'Удалить';
            button.dataset.id = task.id;
            spanWrapper.classList.add('wrapper');
            button.id = 'removeTaskButton';
            button.classList.add('remove-button');
            spanWrapper.appendChild(spanTitle);
            spanWrapper.appendChild(spanTaskType);
            spanWrapper.appendChild(spanTaskStatus);
            li.appendChild(spanWrapper);
            li.appendChild(button);

            this.taskList.appendChild(li);
        })

    }

    private _createTask() {
        this._resetContent();
        this._changeVisibleFields();
        this._openModal();
    }

    private _openModal() {
        this.modal.openModal();
    }

    private _closeModal() {
        this.modal.closeModal();
    }

    private _addTask() {
        const task: Task = {
            id: this.currentId ?? this.generateUUID(),
            title: this.titleInput.value.trim(),
            description: this.descriptionInput.value.trim(),
            createDate: new Date(),
            status: this.taskStatusSelect.value as Status,
            type: this.taskTypeSelect.value as TaskType,
        };

        if (this.taskTypeSelect.value === TaskType.OFFICE) {
            task.location = this.taskLocationSelect.value as LocationTask;
        }

        if (this.taskTypeSelect.value === TaskType.DEADLINE) {
            task.deadline = this.taskDeadlineInput.value;
        }

        if (this.taskTypeSelect.value === TaskType.ASSIGNEE) {
            task.assignee = this.taskAssigneeSelect.value;
        }

        if (!task.title.length) {
            alert('Пожалуйста, опишите задачу');
            return;
        }

        const currentTaskIndex = this.tasks.findIndex(task => {
            return task.id === this.currentId;
        });

        if (currentTaskIndex !== -1) {
            this.tasks[currentTaskIndex] = task;
        } else {
            this.tasks.push(task);
        }

        this.saveTasks();
        this._closeModal();
    }

    generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0; // Генерируем случайное число от 0 до 15
            const v = c === 'x' ? r : (r & 0x3 | 0x8); // Устанавливаем версию и вариант
            return v.toString(16); // Возвращаем символ в шестнадцатеричном формате
        });
    }

    private _showCurrentTask(id: string) {
        this._openModal();

        const task = this.tasks.find(task => {
            return task.id === id;
        });

        if (task) {
            this.currentId = task.id;
            this.titleInput.value = task.title;
            this.descriptionInput.value = task.description;
            this.taskTypeSelect.value = task.type;

            if (task.deadline) {
                this.taskDeadlineInput.value = task.deadline;
            }

            if (task.location) {
                this.taskLocationSelect.value = task.location;
            }

            if (task.assignee) {
                this.taskAssigneeSelect.value = task.assignee;
            }

            this._changeVisibleFields();
        }
    }

    private _removeTask(id: string): void {
        this.tasks = this.tasks.filter(task => {
            return task.id !== id;
        });
        this.saveTasks();
        this._renderTaskList();
    }

    private saveTasks(): void {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this._renderTaskList();
    }

    private _loadTasks(): void {
        const tasksData = localStorage.getItem('tasks');
        if (tasksData) {
            const tasks: Task[] = JSON.parse(tasksData);
            const validTasks = tasks.filter(task => this.isTask(task));
            if ((validTasks && validTasks.length) || []) {
                this.tasks = JSON.parse(tasksData);
                console.log('hello');
            } else {
                return;
            }
        }

        this._renderTaskList();
    }

    // проверяем данные из LS, если что то не так - убираем из списка
    isTask(task: Task): boolean {
        return (
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.description === "string" &&
            task.createDate instanceof Date &&
            Object.values(Status).includes(task.status) &&
            Object.values(TaskType).includes(task.type)
        );
    }
}

class Modal implements IModal {
    constructor() {
        this.attachListeners();
    }

    attachListeners() {
        document.getElementById('closeModal')?.addEventListener('click', this.closeModal);
        document.getElementById('overlay')?.addEventListener('click', this.closeModal);
    }

    openModal() {
        document.getElementById('modal')?.classList.add('active');
        document.getElementById('overlay')?.classList.add('active');
    }

    closeModal() {
        document.getElementById('modal')?.classList.remove('active');
        document.getElementById('overlay')?.classList.remove('active');
    }
}

const taskManager = new TaskManager();
