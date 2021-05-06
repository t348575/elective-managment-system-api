import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
const files: string[] = [];
(async () => {
    const baseDir = 'src/tests/integration';
    await crawl(baseDir);
    console.log(files);
    for (const [i, v] of files.entries()) {
        const start = new Date();
        const out = spawnSync(
            'yarn',
            ['env:test', 'nyc', '--no-clean', '--silent', 'mocha', '-r', 'ts-node/register', v, '-t', '100000'],
            { shell: true, cwd: process.cwd() }
        );
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
        const end = new Date();
        const time = end.getTime() - start.getTime();
        console.log(
            v,
            'done',
            `${Math.round((((i + 1) * 100) / files.length) * 100) / 100}%`,
            'took',
            `${Math.floor(time / 1000 / 60)} mn ${time / 1000 - Math.floor(time / 1000 / 60) * 60} s`
        );
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
                } catch (err) {
                    if (v.indexOf('.spec.ts') > -1) {
                        files.push(`${dir}/${v}`);
                    }
                }
            }
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}
