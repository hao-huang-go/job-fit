const COFFEE_URL = "https://buymeacoffee.com/tyah0510";

export function CoffeeCard() {
  return (
    <section className="card coffee">
      <p>
        <b>谢谢你认真做完 🙂</b> 这个小网站是我下班后一点点做出来的，不收费、不卖报告。如果它让你对自己多了一点了解，可以请我喝杯咖啡。
      </p>
      <a className="secondary" href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
        ☕ 请我喝杯咖啡
      </a>
    </section>
  );
}
