var AmmoTracker = AmmoTracker || {};

if (!_.has(state, 'ammo_tracker')) {
    state.ammo_tracker = {};
}

AmmoTracker.Weapon = function() {
    this.id         = '';
    this.name       = '';
    this.owner      = '';
    this.ammunition = 0;
};

AmmoTracker.Weapon.prototype.fire    = function() {
    if (this.ammunition === 0 ) {
        log(this.owner + " tried to fire their " + this.name + ", but did not have any ammunition remaining!");
        sendChat("Ammunition tracker", "/w " + this.owner + " you try to fire your " + this.name + ", but discover you do not have any ammunition remaining!");
        return;
    }

    this.ammunition--;
    log(this.owner + " uses one unit of ammunition from their " + this.name + ", they now have " + this.ammunition + " units of ammunition remaining!");
    sendChat("Ammunition tracker", "/w " + this.owner + " you use one unit of ammo, and now have " + this.ammunition + " remaining!");
};

AmmoTracker.Weapon.prototype.reload = function(ammo) {
    if (ammo < 0) {
        log(this.owner + " tried to reload " + this.name + " with a negative number.");
        sendChat("Ammunition tracker", "/w " + this.owner + " You must specify a number greater than or equal to 0 when reloading a weapon.");
        return;
    }

    this.ammunition = ammo;

    log(this.owner + " reloaded their \"" + this.name + "\" with " + ammo + " ammunition.");
    sendChat("Ammunition tracker", "/w " + this.owner + " Reloaded your " + this.name + " with " + ammo + " ammunition.");
};

AmmoTracker.frisk = function(who) {
    log('Frisking ' + who + ' for weapons...');
    if (typeof state.ammo_tracker[who] === 'undefined' || state.ammo_tracker[who].length === 0) {
        log('No weapons found on ' + who + '.');
        sendChat("Ammunition tracker", "/w " + who + " You have not defined any weapons! See \"!ammo\" for instructions on how to add some.");
        return false;
    }

    log(who + ' is carrying ' + state.ammo_tracker[who].length + ' weapons.');
    return true;
};

AmmoTracker.checkHolster = function(who, id, silent) {
    if (typeof silent === 'undefined') {
        silent = false;
    }

    if (typeof id === 'undefined') {
        log('No ID specified. Cannot look for weapon.');
        sendChat("Ammunition tracker", "/w " + who + " This command requires you have to specify a weapon ID. See \"!ammo\" for instructions on the different commands.");
    }

    log('Checking ' + who + ' for a weapon with ID "' + id + '"...');
    if (typeof state.ammo_tracker[who][id] === 'undefined') {
        log('No weapon found on ' + who + ' with ID "' + id + '".');
        if (!silent) {
            sendChat("Ammunition tracker", "/w " + who + " You do not have a weapon with the ID \"" + id + "\"! See \"!ammo list\" to see a list of your weapons.");
        }
        return false;
    }

    log('Weapon with ID "' + id + '" found on ' + who + '.');
    return true;
};

on("chat:message", function(msg) {
    if (msg.type != 'api') {
        return;
    }

    var args    = msg.content.split(/\s+/),
        command = args.shift().replace('!', '');

    if (command !== 'ammo') {
        return;
    }

    command = args.shift();

    var id = args.shift();
    var owner = msg.who.replace(' (GM)', '');

    switch (command) {
        case 'add':
            var name = args.shift()               || 'Gun'
                ammo = parseInt(args.shift(), 10) || 10;

            id = id || name;

            state.ammo_tracker[owner] = state.ammo_tracker[owner] || {};

            if (AmmoTracker.checkHolster(owner, id, true)) {
                sendChat("Ammunition tracker", "/w " + owner + " You already have a weapon with ID \"" + id + "\". Please try again with a different ID or enter \"!ammo help\" for more commands.");
                return;
            }

            var weapon        = new AmmoTracker.Weapon;
            weapon.id         = id;
            weapon.name       = name;
            weapon.owner      = owner;
            weapon.ammunition = ammo;

            state.ammo_tracker[owner][id] = weapon;

            log(owner + " added a new weapon with ID \"" + id + "\".");
            sendChat("Ammunition tracker", "/w " + owner + " You have added a weapon with ID \"" + id + "\", name \"" + name + "\", and " + ammo + " ammunition.");

            break;
        case 'del':
            if (!AmmoTracker.frisk(owner) || !AmmoTracker.checkHolster(owner, id)) {
                return;
            }

            delete state.ammo_tracker[owner][id];
            log(owner + " removed weapon with ID \"" + id + "\".");
            sendChat("Ammunition tracker", "/w " + owner + " You have removed the weapon with ID \"" + id + "\".");

            break;
        case 'reload':
            if (!AmmoTracker.frisk(owner) || !AmmoTracker.checkHolster(owner, id)) {
                return;
            }

            var newammo = parseInt(args.shift(), 10) || 10;
            state.ammo_tracker[owner][id].reload(newammo);
            break;
        case 'list':
            if (!AmmoTracker.frisk(owner)) {
                return;
            }

            var ids = Object.getOwnPropertyNames(state.ammo_tracker[owner]);
            ids.forEach(function(id) {
                var weapon = state.ammo_tracker[owner][id];
                sendChat("Ammunition Tracker", "/w " + owner + " Weapon: Name - \"" + weapon.name + "\", ID - \"" + weapon.id + "\", Ammunition remaining - " + weapon.ammunition);
            });

            break;
        case 'fire':
            if (!AmmoTracker.frisk(owner) || !AmmoTracker.checkHolster(owner, id)) {
                return;
            }

            state.ammo_tracker[owner][id].fire();

            break;
        default:
            sendChat("Ammunition tracker", "/w " + owner + " Hello! This is the help message! To declare a new weapon type use !ammo set *SLOT* *WEAPON_NAME* *AMMUNITION*. There can be no spaces. If a slot is occupied by another player, you will not be able to use that slot. Whenever you fire, type !ammo fire *SLOT*.Use !ammo del *SLOT* to delete a slot.Use !ammo edit *SLOT* *NEW_AMMO_VALUE* to edit the ammunition of a weapon. It is 100% necessary to have slots correctly written. ENJOY!");
            break;
    }
});
