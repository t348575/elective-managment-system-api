import { existsSync, readdirSync } from 'fs';
import { spawnSync } from 'child_process';
const files: string[] = [];
(async () => {
    const baseDir = 'src/tests/unit';
    await crawl(baseDir);
    console.log(files);
    if (existsSync('coverage')) {
        spawnSync('shx', ['rm', '-rf', 'coverage'], { shell: true, cwd: process.cwd() });
    }
    if (existsSync('.nyc_output')) {
        spawnSync('shx', ['rm', '-rf', '.nyc_output'], { shell: true, cwd: process.cwd() });
    }
    for (const [i, v] of files.entries()) {
        const out = spawnSync('yarn', ['env:test', 'nyc', '--no-clean', '--silent', 'mocha', '-r', 'ts-node/register', v, '-t', '100000'], { shell: true, cwd: process.cwd() });
        if (out.status && out.status !== 0) {
            if (out.stdout) {
                console.log(out.stdout.toString());
            }
            if (out.stderr) {
                console.log(out.stderr.toString());
            }
            // @ts-ignore
            process.exit(out.status);
        }
        console.log(v, 'done', `${Math.round(((i + 1) * 100 / files.length) * 100) / 100}%`,);
    }
    spawnSync('nyc', ['report', '--reporter=lcov'], { shell: true, cwd: process.cwd() });
})();
function crawl(dir: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            const innerFiles = readdirSync(dir);
            for (const v of innerFiles) {
                try {
                    await crawl(`${dir}/${v}`);
                }
                catch(err) {
                    if (v.indexOf('.spec.ts') > -1) {
                        files.push(`${dir}/${v}`);
                    }
                }
            }
            resolve();
        }
        catch(err) {
            reject(err);
        }
    });
}
