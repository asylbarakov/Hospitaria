// Менеджер персонала (этап 15): найм, посты, зарплата, пятна и автоматизация.
// Чистая логика без Phaser: мир приходит адаптером StaffPoints, движение — StaffRunner.

import StaffAgent, { STAFF_STATES } from './StaffAgent.js';
import StaffDirt from './StaffDirt.js';
import automateStaff from './StaffAutomation.js';
import {
  POST_TITLES, STAFF_CONFIG, STAFF_NAMES, STAFF_ROLES, staffRole,
} from '../data/staffCatalog.js';

const ALL_POST_TYPES = [...new Set(STAFF_ROLES.flatMap((role) => role.postTypes))];

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

export default class StaffFlow {
  /**
   * @param {{world:object, patients?:object, saved?:Array, random?:Function,
   *   timing?:object, getCoins?:Function, spend?:Function, penalty?:Function,
   *   notify?:Function, onChange?:Function, onEvent?:Function}} options
   */
  constructor(options = {}) {
    this.world = options.world;
    this.patients = options.patients || null;
    this.random = typeof options.random === 'function' ? options.random : Math.random;
    this.timing = { ...STAFF_CONFIG, ...(options.timing || {}) };
    this.hooks = {
      getCoins: options.getCoins || (() => 0),
      spend: options.spend || (() => {}),
      penalty: options.penalty || (() => {}),
      notify: options.notify || (() => {}),
      onChange: options.onChange || (() => {}),
      onEvent: options.onEvent || (() => {}),
    };
    this.agents = [];
    this.nextId = 1;
    this.revision = -1;
    this.dayTimer = 0;
    this.daysPaid = 0;
    this.dirtSystem = new StaffDirt({
      world: this.world,
      timing: this.timing,
      random: this.random,
      notify: this.hooks.notify,
      penalty: this.hooks.penalty,
      onEvent: (event) => this.emit(event),
    });
    this.load(options.saved || []);
    this.refreshPosts(true);
  }

  get dirt() {
    return this.dirtSystem.spots;
  }

  emit(event) {
    this.hooks.onEvent(event);
  }

  load(saved) {
    (saved || []).forEach((entry) => {
      const role = staffRole(entry && entry.roleId);
      if (!role) {
        return;
      }
      this.agents.push(new StaffAgent({
        id: this.nextId++,
        role,
        name: entry.name || pick(STAFF_NAMES, this.random),
        entrance: this.world.entrance(),
        postItemId: entry.postItemId,
      }));
    });
  }

  availablePosts() {
    return this.world.posts(ALL_POST_TYPES) || [];
  }

  roleCanUse(agent, post) {
    return !!post && agent.role.postTypes.includes(post.type);
  }

  /** Пересобрать посты после найма или изменения мебели. */
  refreshPosts(force = false) {
    const revision = this.world.revision();
    if (!force && revision === this.revision) {
      return false;
    }
    this.revision = revision;
    const posts = this.availablePosts();
    const used = new Set();

    this.agents.forEach((agent) => {
      if (!agent.post) {
        return;
      }
      const found = posts.find((post) => post.key === agent.post.key && this.roleCanUse(agent, post));
      if (!found || used.has(found.key)) {
        agent.assignPost(null);
      } else {
        agent.post = found;
        used.add(found.key);
      }
    });

    this.agents.forEach((agent) => {
      if (agent.post || !Number.isFinite(agent.desiredPostId)) {
        return;
      }
      const found = posts.find((post) => post.itemId === agent.desiredPostId
        && !used.has(post.key) && this.roleCanUse(agent, post));
      if (found) {
        agent.assignPost(found);
        used.add(found.key);
      }
    });

    this.agents.forEach((agent) => {
      if (agent.post || !agent.role.postTypes.length) {
        return;
      }
      const found = posts.find((post) => !used.has(post.key) && this.roleCanUse(agent, post));
      if (found) {
        agent.assignPost(found);
        used.add(found.key);
      }
    });

    const idle = this.world.idleSpots() || [];
    let idleIndex = 0;
    this.agents.forEach((agent) => {
      if (agent.post || agent.dirt || !idle.length) {
        return;
      }
      agent.assignIdle(idle[idleIndex % idle.length]);
      idleIndex += 1;
    });
    return true;
  }

  hire(roleId) {
    const role = staffRole(roleId);
    if (!role) {
      return { ok: false, hint: 'Неизвестная роль' };
    }
    if (this.agents.length >= this.timing.maxStaff) {
      return { ok: false, hint: 'Больше сотрудников нанять нельзя' };
    }
    if (this.hooks.getCoins() < role.price) {
      return { ok: false, hint: 'Не хватает монет на найм' };
    }
    const agent = new StaffAgent({
      id: this.nextId++,
      role,
      name: pick(STAFF_NAMES, this.random),
      entrance: this.world.entrance(),
    });
    this.agents.push(agent);
    this.hooks.spend(role.price);
    this.refreshPosts(true);
    this.emit({ type: 'hired', agent });
    this.hooks.notify(`${agent.name} (${role.title}) принят на работу`);
    this.hooks.onChange();
    return { ok: true, agent };
  }

  fire(id) {
    const agent = this.agents.find((item) => item.id === id);
    if (!agent) {
      return false;
    }
    agent.removed = true;
    this.agents = this.agents.filter((item) => item !== agent);
    if (agent.post) {
      agent.assignPost(null);
    }
    this.refreshPosts(true);
    this.emit({ type: 'fired', agent });
    this.hooks.notify(`${agent.name} уволен`);
    this.hooks.onChange();
    return true;
  }

  totalSalary() {
    return this.agents.reduce((sum, agent) => sum + (agent.role.salary || 0), 0);
  }

  updateSalary(dt) {
    this.dayTimer += dt;
    while (this.dayTimer >= this.timing.salaryDayMs) {
      this.dayTimer -= this.timing.salaryDayMs;
      this.paySalary();
    }
  }

  paySalary() {
    this.daysPaid += 1;
    const total = this.totalSalary();
    if (total <= 0) {
      return 0;
    }
    this.hooks.spend(total);
    this.emit({ type: 'salary', amount: total, day: this.daysPaid });
    this.hooks.notify(`Зарплата персонала за день: −${total}`);
    return total;
  }

  spawnDirt() {
    return this.dirtSystem.spawn();
  }

  /** Прибытие работника к посту или пятну. */
  arrived(agent) {
    if (!agent || agent.removed) {
      return null;
    }
    return agent.arrived(this.timing.cleanMs);
  }

  update(dt) {
    if (!dt || dt < 0) {
      return;
    }
    this.refreshPosts();
    this.updateSalary(dt);
    this.dirtSystem.update(dt);
    this.dirtSystem.assign(this.agents);
    this.agents.forEach((agent) => {
      const cleaned = agent.update(dt);
      if (cleaned) {
        this.dirtSystem.finish(agent, cleaned);
      }
    });
    automateStaff(this, dt);
  }

  statusOf(agent) {
    if (agent.state === STAFF_STATES.GO_TO_POST) return 'идёт на пост';
    if (agent.state === STAFF_STATES.WORKING) return 'на посту';
    if (agent.state === STAFF_STATES.GO_TO_DIRT) return 'идёт убирать';
    if (agent.state === STAFF_STATES.CLEANING) return 'убирает';
    return agent.post ? 'ждёт' : 'ждёт пост';
  }

  hudState() {
    return {
      hired: this.agents.map((agent) => ({
        id: agent.id,
        roleId: agent.roleId,
        title: agent.role.title,
        name: agent.name,
        status: this.statusOf(agent),
        postTitle: agent.post ? POST_TITLES[agent.post.type] || 'пост' : '',
      })),
      max: this.timing.maxStaff,
      salary: this.totalSalary(),
      dirt: this.dirt.length,
      daysPaid: this.daysPaid,
    };
  }

  exportStaff() {
    return this.agents.map((agent) => ({
      roleId: agent.roleId,
      name: agent.name,
      postItemId: agent.post && Number.isFinite(agent.post.itemId) ? agent.post.itemId : null,
    }));
  }

  destroy() {
    this.agents.forEach((agent) => { agent.removed = true; });
    this.agents = [];
    this.dirtSystem.clear();
  }
}
