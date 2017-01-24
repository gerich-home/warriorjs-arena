import fs from 'fs';
import path from 'path';
import playLevel from 'warriorjs-engine';
import randomSeed from 'random-seed';
import _ from 'lodash';

class Summary {
    constructor(players, levels, allStatistics) {
        this.players = players
        this.levels = levels;
        this.allStatistics = allStatistics;
        
        this.playerStatistics = _(allStatistics).groupBy(stat => stat.player.name).value();
        this.levelStatistics  = _(allStatistics).groupBy(stat => stat.level.id).value();
    }
    
    print() {
        const maxScoreLength = this.maxScore().toString().length;
        const maxPercentLength = this.maxPercent().toString().length;
        const maxNameLength = _(this.players).map(player => player.name.length).max();
        
        const sortedPlayers = _(this.players).sortBy(p => -this.playerTotalScore(p)).value();
        
        for (var player of sortedPlayers) {
            console.log(_.pad(player.name, maxNameLength) + ' | Passed ' + _.padEnd(this.playerPercentPassed(player), maxPercentLength) + '% | Total score ' + _.padEnd(this.playerTotalScore(player), maxScoreLength));
        }
        
        if(config.showDetails) {
            for (var player of sortedPlayers) {
                console.log();
                console.log(_.pad(' ' + player.name + ' ', 30, '#'));
                console.log('Passed ' + this.playerPercentPassed(player) + '% | Total score ' + this.playerTotalScore(player));
                
                for(var levelStat of _(this.playerStatistics[player.name]).sortBy((stat) => stat.level.id)) {
                    console.log();
                    console.log(_.pad(' level ' + levelStat.level.id + ' ', 30, '-'));
                    console.log(this.levelImage(levelStat.level.floor));
                    console.log();
                    
                    if(levelStat.results.passed) {
                        console.log('Passed');
                        var score = this.sumScore(levelStat);
                        
                        if(this.maxLevelScore(levelStat.level) === score) {
                            console.log('BEST SCORE!');
                        }
                        
                        console.log('Score:        ' + score);
                        console.log(' warrior:     ' + levelStat.results.score.warrior);
                        console.log(' time bonus:  ' + levelStat.results.score.timeBonus);
                        console.log(' clear bonus: ' + levelStat.results.score.clearBonus);
                    }
                    else {
                        console.log('FAILED');
                    }
                        
                    if(config.showEvents) {
                        for(var event of levelStat.results.events) {
                            if(event.type === 'PLAY_STARTED') {
                            } else if(event.type === 'FLOOR_CHANGED') {
                                console.log(' ' + this.levelImage(event.floor));
                            }
                            else if(event.type === 'UNIT_SPOKE') {
                                console.log('  ' + event.message);
                            }
                            else if(event.type === 'TURN_CHANGED') {
                                console.log('TURN ' + event.turn);
                            }
                            else {
                                console.log(JSON.stringify(event, null, ' '));
                            }
                        }
                    }
                }
            }
        }
    }
    
    levelImage(floor) {
        var field = _.pad('', floor.size.width);
        field = this.replaceAt(field, floor.stairs.x, floor.stairs.x === 0 ? '>' : '<');
        if(floor.warrior) {
            field = this.replaceAt(field, floor.warrior.x, '@');
        }
        
        for(var unit of floor.units) {
            field = this.replaceAt(field, unit.x, this.unitImage(unit));
        }
        
        var result = '[' + field + ']';
        
        if(floor.warrior) {
            return result + ' facing ' + floor.warrior.facing;
        }
        
        return result;
    }
    
    replaceAt(s, index, character) {
        return s.substr(0, index) + character + s.substr(index+character.length);
    }
    
    unitImage(unit) {
        switch(unit.type) {
            case 'sludge': return 's';
            case 'thickSludge': return 'S';
            case 'archer': return 'a';
            case 'captive': return 'C';
            case 'wizard': return 'w';
        }
        
        return '?';
    }
    
    maxScore() {
        return _(this.players).map(player => this.playerTotalScore(player)).max();
    }
    
    maxLevelScore(level) {
        return _(this.levelStatistics[level.id]).map(statistic => this.sumScore(statistic)).max();
    }
    
    maxPercent() {
        return _(this.players).map(player => this.playerPercentPassed(player)).max();
    }

    playerTotalScore(player) {
        return _(this.playerStatistics[player.name]).map(statistic => this.sumScore(statistic)).sum();
    }

    playerPercentPassed(player) {
        let statistics = this.playerStatistics[player.name];
        
        return 100 * statistics.filter(statistic => statistic.results.passed).length / statistics.length;
    }

    sumScore(statistic) {
        if(!statistic.results.passed) {
            return 0;
        }
        
        const score = statistic.results.score;
        return score.warrior + score.timeBonus + score.clearBonus;
    }
}

const config = process.argv[2] ? require(process.argv[2]) : {};

const random = randomSeed.create(config.seed);

const players = [...getPlayers()];
const levels = [...generateLevels()];

const allStatistics = [];

for (var level of levels) {
	for (var player of players) {
        allStatistics.push({
            level: level,
            player: player,
            results: playLevel(level, player.code)
        });
	}
}

new Summary(players, levels, allStatistics).print();

function* getPlayers() {
	yield* fs.readdirSync('players')
        .map(filename => path.join('players', filename))
        .filter(filename => fs.statSync(filename).isFile())
        .filter(filename => path.extname(filename) === '.js')
        .map(filename => ({
                    name: path.basename(filename, '.js'),
                    code: fs.readFileSync(filename)
                }));
}

function* generateLevels() {
	const abilities = [{
			name: 'walk',
			args: []
		}, {
			name: 'attack',
			args: []
		}, {
			name: 'feel',
			args: []
		}, {
			name: 'rescue',
			args: []
		}, {
			name: 'look',
			args: []
		}, {
			name: 'health',
			args: []
		}, {
			name: 'shoot',
			args: []
		}, {
			name: 'rest',
			args: []
		}, {
			name: 'pivot',
			args: []
		}
	];

    for(var i = 0; i < (config.levels || 10); i++) {
        var field = getField();
        
        var units = [];
        for(var j = 0; j < field.numUnits; j++) {
            units.push(getRandomUnit(field));
        }
        
        yield {
            id: i,
            timeBonus: config.timeBonus || 15,
            floor: {
                size: {
                    width: field.width,
                    height: 1
                },
                stairs: {
                    x: field.stairsCell,
                    y: 0
                },
                warrior: {
                    name: 'Warrior',
                    x: field.getNextFreeCell(),
                    y: 0,
                    facing: getRandomDirection(),
                    abilities: abilities
                },
                units: units
            }
        };
    }
    
    function getRandomUnit(field) {
        return {
            type: getRandomType(),
            x: field.getNextFreeCell(),
            y: 0,
            facing: getRandomDirection()
        };
    }
    
    function getRandomInt(min, max) {
        return random(max - min + 1) + min;
    }
    
    function getRandomOf(...values) {
        return values[getRandomInt(0, values.length - 1)];
    }
    
    function getRandomDirection() {
        return getRandomOf('east', 'west');
    }
    
    function getRandomType() {
        return getRandomOf('sludge', 'thickSludge', 'archer', 'captive', 'wizard');
    }
    
    function getField() {
        const numUnits     = config.numUnits     || getRandomInt(config.minUnits     || 1, config.maxUnits     || 5);
        const numFreeCells = config.numFreeCells || getRandomInt(config.minFreeCells || 0, config.maxFreeCells || 4);
        const width = numUnits + numFreeCells + 2;
        
        const stairsCell = getRandomOf(0, width);
        const usedCells = [stairsCell];
        
        return {
            width: width,
            stairsCell: stairsCell,
            numUnits: numUnits,
            getNextFreeCell: function() {
                var cell = getRandomInt(0, width - usedCells.length);
                
                for(var usedCell of usedCells) {
                    if(cell >= usedCell) {
                        cell++;
                    }
                }
                
                usedCells.push(cell);
                usedCells.sort();
                
                return cell;
            }
        }
    }
}