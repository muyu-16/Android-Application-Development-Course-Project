import SwiftUI

struct DiceScreen: View {
    let namespace: Namespace.ID
    @State private var currentValue = 1
    @State private var isRolling = false
    @State private var rotation: Double = 0
    @State private var scale: CGFloat = 1

    var body: some View {
        VStack(spacing: DesignToken.stackSpacing) {
            // Header
            Text("Dice Roll")
                .font(.largeTitle.bold())
                .foregroundStyle(DesignToken.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 60)
                .padding(.horizontal, DesignToken.margin)

            Text("Tap to roll")
                .font(.callout)
                .foregroundStyle(DesignToken.textTertiary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, DesignToken.margin)

            Spacer()

            // Dice
            GlassCard(tint: .pink.opacity(0.08)) {
                DiceFace(value: currentValue)
                    .rotation3DEffect(.degrees(rotation), axis: (x: 1, y: 1, z: 0))
                    .scaleEffect(scale)
                    .frame(width: 200, height: 200)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 30)
            }
            .padding(.horizontal, DesignToken.margin)
            .onTapGesture { roll() }

            // Result
            if isRolling {
                Text("Rolling...")
                    .font(.title2)
                    .foregroundStyle(DesignToken.textTertiary)
            } else {
                NumberTile(value: "\(currentValue)", size: 48)
                Text("You rolled a \(currentValue)!")
                    .font(.title3)
                    .foregroundStyle(DesignToken.textSecondary)
            }

            Spacer()

            // Roll Button
            GlassButton(title: isRolling ? "Rolling..." : "🎲 Roll the Dice",
                       icon: "die.face.\(currentValue).fill",
                       action: roll,
                       tint: .pink)
                .disabled(isRolling)
                .padding(.horizontal, DesignToken.margin)
                .padding(.bottom, 80)
        }
    }

    private func roll() {
        guard !isRolling else { return }
        isRolling = true
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()

        withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
            rotation += 720
            scale = 1.3
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(DesignToken.springBouncy) {
                currentValue = Int.random(in: 1...6)
                rotation += 360
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                scale = 1.0
                isRolling = false
            }
        }
    }
}

// MARK: - Dice Face
struct DiceFace: View {
    let value: Int

    var body: some View {
        ZStack {
            // Glass background
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)

            // Dots
            ForEach(dotPositions, id: \.self) { pos in
                Circle()
                    .fill(DesignToken.textPrimary)
                    .frame(width: 28, height: 28)
                    .position(x: pos.x * 200, y: pos.y * 200)
            }
        }
        .frame(width: 200, height: 200)
    }

    private var dotPositions: [CGPoint] {
        switch value {
        case 1: return [CGPoint(x: 0.5, y: 0.5)]
        case 2: return [CGPoint(x: 0.3, y: 0.3), CGPoint(x: 0.7, y: 0.7)]
        case 3: return [CGPoint(x: 0.3, y: 0.3), CGPoint(x: 0.5, y: 0.5), CGPoint(x: 0.7, y: 0.7)]
        case 4: return [CGPoint(x: 0.3, y: 0.3), CGPoint(x: 0.7, y: 0.3),
                        CGPoint(x: 0.3, y: 0.7), CGPoint(x: 0.7, y: 0.7)]
        case 5: return [CGPoint(x: 0.3, y: 0.3), CGPoint(x: 0.7, y: 0.3),
                        CGPoint(x: 0.5, y: 0.5),
                        CGPoint(x: 0.3, y: 0.7), CGPoint(x: 0.7, y: 0.7)]
        default: return [CGPoint(x: 0.3, y: 0.25), CGPoint(x: 0.7, y: 0.25),
                         CGPoint(x: 0.3, y: 0.5), CGPoint(x: 0.7, y: 0.5),
                         CGPoint(x: 0.3, y: 0.75), CGPoint(x: 0.7, y: 0.75)]
        }
    }
}
