# WarriorJS Arena
Testing JS warriors on randomly generated levels

## Why?
You have just designed some warrior for [WarriorJS](https://github.com/olistic/warriorjs) but how can you know it it the best one?

Just run this script that will generate as many random levels as you want and see how it compares to your friends' warriors!

## Usage

Clone sources somewhere (there is no npm package for it yet).

Execute the command
```
npm install
```

Write your own warrior as it is described in [game rules](https://github.com/olistic/warriorjs#objective).

Put the js file with the code of your warrior into \players directory.

Run the game:
```
npm start ./configs/10-levels.json
```

Observe the summary of game results:
```
you    | Passed 50% | Total score 131
naive  | Passed 30% | Total score 48
runner | Passed 10% | Total score 12
```

## Config
The generated levels and rules can be configured with a json file.
You should pass it as a parameter to the program.

The example of configuration file:
```json
{
    "seed": 1,
    "levels": 10,
    "showDetails": false,
    "showEvents": false
}
```

Currently the following configuration values are supported:

### seed
The number or string that is used as a seed for the generated levels.
If omited then each run will be fully random.

### levels
The number of levels to generate or 5 by default.

### timeBonus
The time bonus or 15 by default.

### numUnits
The exact number of units (other from warrior). If not set then `minUnit` and `maxUnits` are used.

### minUnits
The minimum number of units (other from warrior) or 1 by default.

### maxUnits
The maximum number of units (other from warrior) or 5 by default.

### numFreeCells
The exact number of free cells. If not set then `minFreeCells` and `maxFreeCells` are used.

### minFreeCells
The minimum number of free cells or 0 by default.

### maxFreeCells
The maximum number of free cells or 4 by default.

### showDetails
Boolean indicating whether or not to show level image and the score each warrior earned at each level. False by default.

### showEvents
Boolean indicating whether or not to show the full log of events at each level. Requires `showDetails` to be set to `true`. False by default.

## TODO
1. Create npm package
2. Generate 2D levels
3. Configure types of units
4. Configure abilities
5. Configure the list of warriors to be run (useful for debugging the warrior)
6. Configure the list of level ids to be run (useful for debugging the warrior, while using the same seed)
